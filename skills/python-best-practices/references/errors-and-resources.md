# Errors and resources

- Use this reference when work acquires resources, crosses external boundaries, or changes failure behavior.
- Read [types and validation](types-and-validation.md) when decoded values become trusted domain data.
- Read [concurrency](concurrency.md) when cleanup depends on tasks, cancellation, or worker completion.

## Put exception handling at a meaningful boundary

- Catch a failure when the current layer can recover, translate it into a useful domain concept, or report it.
- Otherwise, let the exception propagate. Repeated catch-and-reraise layers add little unless they add context.
- Keep the `try` suite focused on the operation whose failure you intend to handle.
- A matching exception from a callback or later computation is not necessarily the failure you expected.
- Use `else` when successful follow-up work should remain outside a preceding handler.
- Catch specific exception classes when their distinctions affect recovery.
- Catching `Exception` can be appropriate at an application boundary that reports unexpected failures and fails the operation.
- Do not convert every exception into `None`, an empty result, or a success status.
- Do not routinely catch `BaseException`. Process-control exceptions and async cancellation must remain effective.

| Situation | Useful contract |
| --- | --- |
| Absence is an ordinary result | Return `None` or another explicit absence representation. |
| Input has the wrong Python type | Use `TypeError` when that distinction belongs to the API. |
| Input has an unacceptable value | Use `ValueError` or a useful domain-specific exception. |
| A lower-level operation fails | Preserve the exception, or translate it with its cause. |
| The application cannot complete a command | Report the failure and return a nonzero exit status. |

- Define a domain exception when callers need to identify a failure without knowing implementation details.
- Do not create a separate exception class for every private helper.
- Give failures concrete context, such as the operation, file, or record location.
- Preserve machine-readable attributes when callers must inspect them; do not make callers parse exception messages.
- Use `raise DomainError(message) from error` when translating a caught exception.
- Use bare `raise` to propagate the active exception without replacing it.
- Use `from None` only when hiding displayed context improves the intended interface. It does not erase the underlying context.
- Keep secrets out of messages, exception attributes intended for display, and object representations.

Sources: [handling exceptions](https://docs.python.org/3.14/tutorial/errors.html#handling-exceptions), [exception chaining](https://docs.python.org/3.14/tutorial/errors.html#exception-chaining), and [raise statements](https://docs.python.org/3.14/reference/simple_stmts.html#the-raise-statement).

## Validation is not an assertion

- Use explicit checks for required input validation, permissions, and domain constraints.
- Python can remove `assert` statements under optimization. They cannot enforce checks required for correct operation.
- Assertions are useful for internal expectations and test failures; they do not replace handling external input.
- Recheck assumptions at a boundary where data can change or trust changes, not mechanically inside every private function.
- Do not mistake successful parsing for successful validation. Valid JSON can contain the wrong shape or unacceptable values.

Sources: [assert statements](https://docs.python.org/3.14/reference/simple_stmts.html#the-assert-statement) and [typing runtime behavior](https://docs.python.org/3.14/library/typing.html).

## Keep ownership and cleanup together

- Identify who acquires a resource, who uses it, and who must close it.
- Prefer a context manager when the resource lifetime fits a scope.
- Close resources the function owns. Keep caller-owned resources open unless the contract explicitly transfers ownership.
- A context manager defines its own exit behavior. Exiting does not universally mean commit, rollback, durable flush, or close.
- Do not rely on garbage collection for timely file, socket, transaction, or subprocess cleanup.
- If acquisition has several steps, arrange cleanup after each successful acquisition.
- Use `ExitStack` for a dynamic set of context managers or cleanup callbacks.
- Use `AsyncExitStack` when asynchronous cleanup is required, including mixed synchronous and asynchronous resources.
- If `__enter__` fails, its corresponding `__exit__` is not called. The acquisition code must clean up partial state.
- A returned open resource transfers a lifecycle obligation. Make that obligation explicit or expose a context-managed operation.

### Preserve failures during cleanup

- Put cleanup in `finally` when a context manager is not available.
- Avoid `return`, `break`, or `continue` that leaves a `finally` suite. Such control flow can discard a pending failure.
- A cleanup operation can itself fail. Decide how callers observe that failure without silently losing the original context.
- A truthy `__exit__` return value suppresses an exception. Return it only when suppression is intentional.
- A generator-based context manager that catches an exception merely to log it must reraise it.
- Registering callbacks on `ExitStack` is not enough; the stack itself needs an explicit lifetime and closure.

Sources: [with statements](https://docs.python.org/3.14/reference/compound_stmts.html#the-with-statement), [finally clauses](https://docs.python.org/3.14/reference/compound_stmts.html#finally-clause), and [contextlib](https://docs.python.org/3.14/library/contextlib.html).

## Give resource-owning iteration an explicit lifetime

- A generator suspends its body between yielded values. Resources acquired inside it can remain open during suspension.
- Stopping a loop with `break` does not guarantee that the generator closes immediately.
- Iterator adapters do not automatically take responsibility for closing their inputs.
- Prefer passing a borrowed resource into a generator when the caller already owns its lifetime.
- When the operation opens its own resource, expose a context manager that contains the iteration lifetime.
- Use `closing` for an owned closeable iterator and `aclosing` for an owned async generator when appropriate.
- Keep async-generator cleanup in the context where its dependencies remain alive.
- Place handlers around consumption when parsing or I/O occurs lazily, not only around generator creation.

### Example: borrowed parsing and owned file access

- This example reads JSON Lines with a required string `level` field. Blank or malformed records are errors.
- `iter_levels` borrows its stream; `open_levels` owns the file it opens.
- Parsing errors include a source label and line number. Filesystem errors retain their native exception types.
- Consume the returned iterator inside the `with` block, including when iteration stops early.
- Annotate the generator body with `Generator[...]`; `contextmanager` uses its exception and cleanup methods.

```python
import json
from collections.abc import Generator, Iterator
from contextlib import contextmanager
from pathlib import Path
from typing import TextIO


class EventFormatError(ValueError):
    """An event record cannot supply its required level."""


def iter_levels(stream: TextIO, *, source_name: str = "input") -> Iterator[str]:
    """Read event levels without closing the borrowed stream."""
    for line_number, line in enumerate(stream, start=1):
        location = f"{source_name}:{line_number}"
        try:
            value: object = json.loads(line)
        except json.JSONDecodeError as error:
            raise EventFormatError(f"{location}: invalid JSON") from error
        if not isinstance(value, dict):
            raise EventFormatError(f"{location}: expected an object")
        level: object = value.get("level")
        if not isinstance(level, str):
            raise EventFormatError(f"{location}: expected a string level")
        yield level


@contextmanager
def open_levels(path: Path) -> Generator[Iterator[str]]:
    """Keep the event file open only while its context is active."""
    with path.open(encoding="utf-8") as stream:
        yield iter_levels(stream, source_name=str(path))
```

```python fragment
with open_levels(Path("events.jsonl")) as levels:
    for level in levels:
        if level == "error":
            break
```

Sources: [generator execution and closing](https://docs.python.org/3.14/reference/expressions.html#generator-iterator-methods), [closing](https://docs.python.org/3.14/library/contextlib.html#contextlib.closing), and [aclosing](https://docs.python.org/3.14/library/contextlib.html#contextlib.aclosing).

## Treat text, bytes, and paths as different interfaces

- Use `str` for text and bytes-like values for byte-defined protocols.
- Decode and encode at the boundary using the format’s specified encoding.
- Specify `encoding="utf-8"` for a UTF-8 format, rather than relying on the developer machine’s default.
- Preserve binary data as binary. Text mode can translate newlines and change the bytes being processed.
- Do not silently ignore or replace decoding errors unless loss is part of the declared recovery policy.
- Use `Path` and path-like interfaces for filesystem operations, rather than manual separator concatenation.
- Do not treat a path as proof of existence, permission, or safe containment.
- Attempt the required operation and handle its failure. An earlier `exists()` or `access()` check can become stale.
- Lexical path checks do not resolve symbolic links. Resolution followed by checking is not a race-proof sandbox either.
- Use platform-appropriate filesystem primitives when the security boundary requires stronger guarantees.
- Keep executable-search semantics explicit. Turning `"./program"` into a normalized path string can remove its `./` prefix.

Sources: [text encoding](https://docs.python.org/3.14/library/io.html#text-encoding), [pathlib](https://docs.python.org/3.14/library/pathlib.html), and [os.access](https://docs.python.org/3.14/library/os.html#os.access).

## Use parsers according to the actual data contract

- Use established parsers for JSON, CSV, TOML, URLs, and other existing formats.
- Apply domain checks after decoding. Use schema or validation libraries when their error reporting and constraints fit the task.
- Decide how the application handles duplicate keys, unknown fields, invalid values, and malformed records.
- Python’s JSON defaults accept duplicate object names and nonfinite numbers. Configure or check stricter contracts explicitly.
- JSON is not a framed stream format. Repeated `dump` calls do not produce a single valid JSON document.
- Use an explicit record format, such as JSON Lines, when processing independent streamed records.
- For large or untrusted inputs, prefer incremental processing and measured resource use over guessed rejection thresholds.
- Do not unpickle data from an untrusted source. Unpickling can execute code.

Sources: [JSON interoperability and limitations](https://docs.python.org/3.14/library/json.html#standard-compliance-and-interoperability) and [pickle security](https://docs.python.org/3.14/library/pickle.html).

## Own child processes through completion

- Prefer argument sequences with ordinary executable invocation instead of constructing shell commands from external strings.
- Use `shell=True` only when shell language is required and input handling is deliberately secured.
- A safe argument boundary does not prevent unwanted options interpreted by the child program. Respect the child’s argument contract.
- Windows batch files can involve shell parsing even without `shell=True`. Check the platform-specific contract.
- Decide whether nonzero exit status is an expected result or an operation failure.
- Use `check=True` when nonzero status should raise `CalledProcessError`.
- Capture output when retaining the complete output is appropriate. Stream it when that retention does not fit the workload.
- Drain stdout and stderr correctly; waiting while a child blocks on a full pipe can deadlock.
- `communicate()` drains pipes but retains captured output in memory.
- A timeout or cancelled awaiter does not universally terminate and reap a child.
- `subprocess.run(timeout=...)` kills and waits for the direct child after timeout; `Popen.communicate(timeout=...)` does not.
- Child descendants require their own process-group or job ownership policy when they must stop together.

Source: [subprocess](https://docs.python.org/3.14/library/subprocess.html), especially Security Considerations, `run`, and `communicate`.

## Retry only when repetition is safe

- Identify the failures that can be transient for this operation. Retrying invalid input or a programming error does not repair it.
- A timeout or lost connection can leave the outcome unknown. It does not prove the remote operation failed.
- Repeat an operation only when its effects are idempotent, a supported deduplication mechanism protects it, or reconciliation establishes safety.
- An idempotency key works only when the receiving system honors its declared deduplication contract.
- Keep the retry scope small enough to avoid repeating already completed, unrelated effects.
- Use the client's existing retry facilities when they fit. Account for lower-layer retries before adding another loop.
- Choose attempts, backoff, and any overall deadline from explicit requirements or the existing client policy.
- Respect protocol-directed retry timing where applicable. Add supported jitter when coordinated retries would overload the service.
- Preserve cancellation and report the final failure with useful context. Do not retry cancellation as a transient item failure.
- For threaded operations, establish actual worker completion before assuming an awaited failure made repetition safe.

Sources: [HTTP idempotence and retry safety](https://www.rfc-editor.org/rfc/rfc9110.html#section-9.2.2) and [urllib3 retry configuration](https://urllib3.readthedocs.io/en/stable/reference/urllib3.util.html#urllib3.util.Retry).

## Separate library diagnostics from application output

- A library uses an identifiable logger, commonly `logging.getLogger(__name__)`.
- Applications configure handlers, destinations, verbosity, and presentation.
- Do not configure root logging or add output handlers while importing a library.
- A `NullHandler` can suppress fallback output for a library that needs that behavior.
- Keep a CLI’s requested data on stdout and diagnostics on stderr.
- Avoid logging and then raising the same failure at every layer. Report it where the operation’s outcome is handled.
- With standard logging, pass message arguments separately when deferred formatting is useful.
- Separate formatting does not defer the evaluation of expensive function arguments; guard expensive diagnostic work when necessary.
- Redact secrets before constructing diagnostic payloads, not only in the final console formatter.

Sources: [logging for libraries](https://docs.python.org/3/howto/logging.html#configuring-logging-for-a-library) and [logging API](https://docs.python.org/3/library/logging.html).
