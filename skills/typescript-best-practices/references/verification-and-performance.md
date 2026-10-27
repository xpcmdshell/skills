# Verification and performance

## Choose evidence for the contract

| Claim | Useful check |
| --- | --- |
| Types describe supported calls | Compile a real consumer, including meaningful rejected calls. |
| External input becomes valid domain data | Drive malformed and valid data through the public boundary. |
| An HTTP operation handles failure | Use a local server with HTTP errors, malformed bodies, and interrupted work. |
| A CLI works after installation | Run its installed entry point in another directory with real files. |
| A resource lifetime is correct | Observe cleanup after success, failure, and relevant early exit. |
| Cancellation stops owned work | Synchronize with started work, request abort, and observe settlement and cleanup. |
| A browser feature works | Drive the actual browser and deployed build, not only a simulated DOM. |
| A package is distributable | Install its tarball in a clean consumer and exercise public exports. |
| A change improves performance | Compare equivalent workloads while checking result and effect contracts. |

- Define integration or end-to-end acceptance checks before implementing new features.
- Prefer a few meaningful public-workflow checks over assertions tied to private helper structure.
- Do not add unit tests, coverage quotas, or a mandatory regression test for every bug fix.
- Avoid testing that source text contains a specific implementation. Several valid implementations should satisfy the same behavior check.
- Type checks, linting, formatting, and behavior tests establish different properties. None replaces all the others.
- Keep fixtures isolated. Use temporary directories, loopback services, and operating-system-assigned ports.
- Synchronize concurrent states explicitly. A guessed sleep does not prove another operation started.
- Use test deadlines from the runner or project policy. Do not invent production limits to make a test convenient.

## Run checks at the correct execution boundary

- `bun test` is the default for Bun-first integration tests. Use the project's existing runner when suitable.
- Use Vitest where its Vite, browser, or framework integration matches the project. Preserve existing Jest or Node test workflows when adequate.
- Use Playwright for real browser workflows. A Bun or Node test process cannot establish browser compatibility.
- Keep browser and server type environments separate. A globally available Node type can hide a browser-only failure.
- Test database and filesystem behavior through real isolated instances or files when they are central to the contract.
- Substitute external services only at the actual external boundary. Avoid mocking internal layers until the test merely repeats implementation assumptions.
- Check exit status, stderr, output data, and effects for commands. A printed success message alone proves little.
- Use declaration-consumer fixtures for type APIs. `@ts-expect-error` is useful for a deliberate invalid call, not as a way to silence real code errors.

## Example: exercise validation through real HTTP

- Use `src/inventory.ts` from [types and validation](types-and-validation.md#example-validate-a-server-response-before-exposing-domain-values).
- Install Bun's types and Zod with the [tooling recipe](tooling.md).
- Complete file, `tests/inventory.integration.test.ts`:

```ts
import assert from "node:assert/strict";
import { expect, test } from "bun:test";
import { fetchInventory } from "../src/inventory.ts";

test("inventory validates server bodies and preserves zero and false", async () => {
  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    fetch(request) {
      switch (new URL(request.url).pathname) {
        case "/valid":
          return Response.json([{ sku: "part-a", stock: 0, active: false }]);
        case "/invalid":
          return Response.json([{ sku: "part-a", stock: "0", active: false }]);
        case "/malformed":
          return new Response("{", {
            headers: { "Content-Type": "application/json" },
          });
        default:
          return new Response("Service unavailable", { status: 503 });
      }
    },
  });
  const controller = new AbortController();

  try {
    const inventory = await fetchInventory(
      new URL("/valid", server.url),
      controller.signal,
    );
    expect(inventory).toEqual([{ sku: "part-a", stock: 0, active: false }]);

    for (const path of ["/invalid", "/malformed", "/unavailable"]) {
      await assert.rejects(
        fetchInventory(new URL(path, server.url), controller.signal),
      );
    }
  } finally {
    await server.stop(true);
  }
});
```

- Run `bun test tests/inventory.integration.test.ts`.
- This test combines transport, JSON decoding, and schema validation without reaching into private schema internals.
- Add cancellation and streaming checks when the feature promises those behaviors. Observe actual task and resource completion.
- For an API that allows unknown fields, test that policy rather than inheriting this example's strict-schema choice.

## Verify hooks and CI independently

- Use the shared command and per-clone installation from [tooling](tooling.md#install-hooks-and-run-independent-ci).
- Confirm a valid commit succeeds and a meaningful type or lint violation rejects the commit.
- Check configuration-only changes and deleted source files, not only modified TypeScript paths.
- Verify that the CI command rejects invalid content even when hooks are absent or bypassed.
- Do not claim remote CI ran from a successful local execution of its commands.

## Check the distributed artifact

- Follow the [packed-consumer procedure](modules-and-packages.md#verify-the-tarball-not-just-the-source-tree) for build, installation, exports, declarations, and supported runtimes.
- For a browser package, run a representative bundler and browser consumer too.

## Diagnose before optimizing

- Measure the workload users experience. Separate network waits, database waits, serialization, allocation, and CPU execution.
- Use the runtime's profiler rather than guessing from the appearance of TypeScript types.
- Types and most type operators disappear before execution. Simplifying a type can improve checking without changing runtime speed.
- `async` does not move CPU work off the event loop. Measure event-loop delay and request latency when server responsiveness matters.
- For large data, investigate streaming and unnecessary copies before adding caches or worker coordination.
- A cache needs explicit key semantics, invalidation, lifetime ownership, and a requirement-based capacity policy.
- Benchmark equivalent inputs and outputs. Preserve ordering, mutation, failure behavior, and resource ownership.
- Include warmup and runtime conditions in the comparison where JIT behavior matters. Do not present a microbenchmark as application-wide evidence.
- Investigate checker performance with `tsc --extendedDiagnostics`; use deeper tracing only when supported by the selected compiler.
- Simplify expensive generic relationships when evidence identifies them. Do not impose arbitrary type-depth or function-length limits.

## Sources

- [Bun test runner](https://bun.sh/docs/test): execution, integration hooks, and runner behavior.
- [Playwright best practices](https://playwright.dev/docs/best-practices): user-visible behavior, isolation, and browser workflows.
- [Vitest browser testing](https://vitest.dev/guide/browser/): framework and browser integration.
- [TypeScript performance guidance](https://github.com/microsoft/TypeScript/wiki/Performance): compiler diagnostics and type-design costs.
- [Node performance hooks](https://nodejs.org/api/perf_hooks.html): runtime measurement and event-loop observations.
