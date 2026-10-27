# Errors, resources, and async

## Choose failures callers can use

| Situation | Representation |
| --- | --- |
| Ordinary absence | `undefined` or the established API's `null` |
| Expected domain alternatives requiring caller action | Discriminated result union |
| Exceptional operational failure | Throw an `Error`, or reject the returned promise |
| Invalid external input | Validation result or error at the boundary |
| Broken internal invariant | Explicit error with useful context, not a success-shaped fallback |

- Follow the surrounding library's failure contract. Do not introduce a universal `Result` framework around ordinary promise APIs.
- A `Promise<T>` describes fulfillment, not rejection types. TypeScript does not enforce checked exceptions.
- JavaScript can throw any value. Treat caught values as `unknown` and narrow before reading properties.
- Throw `Error` objects rather than strings. Use `new Error(message, { cause })` when meaningful translation needs the original failure.
- Create a custom error class when callers need stable typed classification or domain fields, not for every call site.
- Preserve stable error codes where an API supplies them. Do not classify errors by matching human-readable messages.
- Catch narrowly around the operation whose failure you understand. Avoid treating parser bugs or authorization failures as missing data.
- Log at the owning boundary with useful context and redaction. Repeated logging at every rethrow produces duplicate incidents.
- Keep stack traces and secrets out of client responses. Preserve useful diagnostics at the responsible reporting boundary.
- Follow [antipatterns](antipatterns.md#propagate-errors-unless-recovery-satisfies-the-contract) to distinguish permitted recovery from failure masking.
- A CLI can report once to stderr and set `process.exitCode = 1`. Immediate exit can interrupt pending output or cleanup.

## Await the operation inside its failure boundary

- `return operation()` hands the promise to the caller. A surrounding synchronous `catch` cannot catch its later rejection.
- Use `return await operation()` inside `try/catch` when that scope must translate an asynchronous rejection.
- Use `await` before leaving a resource scope when the operation still needs the resource.
- Do not mechanically remove `return await`; ownership, error handling, and stack traces can justify it.
- Do not construct `new Promise(async (...) => ...)`. Use an async function, or a synchronous executor to adapt a callback API.
- Prefer existing promise-based platform APIs over handwritten callback adapters.

## Own acquisition and cleanup

- The function that acquires a resource normally owns cleanup. Borrowed resources remain the caller's responsibility.
- Use `using` for `Symbol.dispose` and `await using` for asynchronous disposal.
- Check the actual API and runtime. A method named `close` does not make an object disposable automatically.
- Disposal runs at scope exit, including early return and throw, in reverse acquisition order.
- Await asynchronous disposal. Do not return a pending operation that still uses a resource about to be disposed.
- Use `try/finally` when an API needs explicit cleanup and does not implement a disposal protocol.
- Acquire inside a protected lifetime. Failure acquiring a later resource must still release earlier resources.
- Disposal can fail. Explicit resource management preserves overlapping failures through `SuppressedError`; ordinary `finally` can replace an earlier error.
- Keep commit, flush, and durability requirements explicit. Closing a handle does not necessarily establish a durable transaction.
- Do not depend on garbage collection or finalizers for prompt resource release.

### Example: keep a file open until the read finishes

- Complete module, `read-text.ts`, for Bun or Node with `FileHandle[Symbol.asyncDispose]` support:

```ts
import { open } from "node:fs/promises";

export async function readText(path: string): Promise<string> {
  await using file = await open(path, "r");
  return await file.readFile({ encoding: "utf8" });
}
```

- `return await` keeps the read inside the lifetime and observes read failure before disposal.
- For a single read, `readFile(path, "utf8")` is simpler and owns its handle internally.
- The explicit handle form fits several operations on the same open file. Do not add a wrapper class solely for cleanup.

## Give every promise an owner

- Await a promise when this operation needs its completion. Return it when ownership transfers to the caller.
- Independent work can start together when its effects and resource use permit concurrency.
- `Promise.all` preserves input result order, rejects on the first observed rejection, and leaves other operations running.
- `Promise.allSettled` waits for every input but does not establish success. Inspect each outcome when failure matters.
- `Promise.race` settles from the first settled input. It does not cancel losers and is not a complete timeout implementation.
- A deliberate background task needs error handling, retained lifecycle ownership, and a shutdown policy.
- `void task()` only discards the returned value. Use an owning supervisor or an explicit `.catch(reportFailure)` as appropriate.
- An async function is assignable to some `void` callback positions. The caller may ignore the returned promise.
- In event handlers and synchronous callback APIs, explicitly route rejection to the application's error boundary.
- Typed lint rules catch many floating and misused promises. They cannot infer the correct lifecycle policy.

## Make cancellation and completion separate

- Accept an `AbortSignal` when callers need to stop work. Pass it into every dependent API that supports it.
- Check an already-aborted signal before starting custom work. Use `signal.throwIfAborted()` when rejection is the contract.
- Remove listeners on ordinary completion too. `{ once: true }` removes a listener only after an abort event fires.
- Combine a caller signal and an owned controller with `AbortSignal.any` when both can stop the operation.
- Choose deadlines and retry budgets from caller policy. A timeout example is not a recommended production limit.
- Request cancellation and then await owned task settlement before releasing shared resources.
- Cancellation cannot undo a remote write already accepted. Use transaction or idempotency semantics when effects require coordination.
- CPU-bound synchronous work blocks the event loop. An async function or `Promise.all` does not move it to another thread.
- Use workers for suitable CPU work. Check data transfer, serialization, lifecycle, and failure handling against the selected runtime.
- For large streams of tasks, use backpressure or a maintained concurrency limiter with an explicit caller-selected capacity.

### Example: fetch an independently needed pair and stop the other request on failure

- Complete module, `fetch-pair.ts`, for modern Bun, Node, or browsers with `AbortSignal.any`.
- The pair is part of this operation's contract, not a general concurrency limit.
- Both response bodies must finish before success. Failure aborts outstanding fetches and waits for local promise settlement.
- Remote effects and remote handler completion remain outside this promise contract.

```ts
async function fetchText(url: URL, signal: AbortSignal): Promise<string> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(`Request failed with HTTP ${response.status}`);
  }
  return await response.text();
}

export async function fetchPair(
  first: URL,
  second: URL,
  callerSignal: AbortSignal,
): Promise<readonly [string, string]> {
  callerSignal.throwIfAborted();
  const controller = new AbortController();
  const signal = AbortSignal.any([callerSignal, controller.signal]);
  const firstTask = fetchText(first, signal);
  const secondTask = fetchText(second, signal);

  try {
    return await Promise.all([firstTask, secondTask]);
  } catch (error) {
    controller.abort(error);
    await Promise.allSettled([firstTask, secondTask]);
    throw error;
  }
}
```

- Sequential fetching is clearer when the second request depends on the first or overlapping effects are not acceptable.
- `allSettled` without fail-fast cancellation fits independent best-effort tasks whose individual outcomes remain useful.
- A shared client shutdown belongs outside both operations and after they stop using it.

## Handle HTTP and streams as protocols

- `fetch` rejects for some transport failures, not ordinary HTTP error statuses. Check `ok` or handle specific statuses deliberately.
- Body reading is another asynchronous operation. Fetch fulfillment does not mean the body finished arriving.
- Request and response bodies are generally single-use. Clone before consumption only when independent readers are actually required.
- Consume or cancel bodies you own when abandoning a response. Do not leave cleanup to garbage collection.
- Parse JSON into `unknown`, then validate shape and domain constraints. See [types and validation](types-and-validation.md).
- Do not retry writes blindly. Establish idempotency, replayable bodies, server guidance, and an approved retry budget.
- Follow backpressure for streaming writes. Resolving an application-level promise must mean the documented write stage actually completed.
- Avoid buffering unbounded input when incremental parsing and processing fit the format.

## Sources

- [MDN Promise.all](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all): ordering, early rejection, and lack of cancellation.
- [MDN AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal): cancellation contracts, combined signals, and listener cleanup.
- [MDN resource management](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Resource_management): disposal order, lifetime, and overlapping errors.
- [Node file handles](https://nodejs.org/api/fs.html#filehandlesymbolasyncdispose): awaited disposal and close behavior.
- [MDN Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch): status handling, body consumption, and cancellation.
- [typescript-eslint no-floating-promises](https://typescript-eslint.io/rules/no-floating-promises/) and [no-misused-promises](https://typescript-eslint.io/rules/no-misused-promises/): ignored-promise hazards.
- [typescript-eslint return-await](https://typescript-eslint.io/rules/return-await/): error handling and resource-scope distinctions.
