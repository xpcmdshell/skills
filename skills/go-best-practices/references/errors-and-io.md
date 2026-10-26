# Errors, streams, and resource boundaries

Read this reference when changing failure behavior, parsing, resource cleanup, HTTP, SQL, or subprocesses.
Use [concurrency and context](concurrency-and-context.md) for cancellation, task ownership, and joining.
Use [values and types](values-and-types.md) for interface nils, aliasing, and borrowed storage.

## Errors are caller-visible values

- The `error` interface supplies an `Error() string` method. Concrete errors can carry structured information and wrap other errors.
- Return a nil error interface for success. An interface containing a nil error pointer is not nil.
- Use `errors.Is(err, target)` for an inspectable condition, including conditions below wrappers.
- Prefer `errors.AsType[*SomeError](err)` for typed extraction. It returns the matching value and a boolean.
- Use `errors.As` when the desired target is an interface that does not implement `error`.
- A direct type assertion examines only the outer error. Tree-aware matching also examines wrapped children.
- Match conditions or types, not diagnostic strings. Message wording can change without changing the intended condition.
- Add context that helps locate the failed operation. Include relevant source names without exposing credentials or private data.

### Decide what wrapping promises

- `%w` exposes the wrapped error to programs. `%v` includes its text without exposing its identity through unwrapping.
- Wrap caller-supplied resource errors when callers need to identify their causes.
- Translate private backend conditions into your documented domain errors when backend independence matters.
- Preserve existing inspectable conditions during maintenance. Replacing `%w` with `%v` can break callers without changing displayed text.
- Do not wrap every implementation error automatically. Exposing `sql.ErrNoRows` can commit a public lookup API to SQL-specific behavior.
- Document the conditions callers can inspect, valid partial results, and side effects that can remain after failure.
- A plain nil/non-nil success contract is sufficient when callers need no finer distinction.

### More than one failure

- `errors.Join` preserves several meaningful errors. It removes nil error interfaces and returns nil when all arguments are nil.
- Joined errors and multi-`%w` formatting create trees. `Is` and `AsType` traverse these trees in pre-order, depth-first order.
- `AsType` returns the first matching value, not all matching failures. Do not infer business priority from scheduling-dependent error order.
- `errors.Unwrap` handles only `Unwrap() error`. A loop calling it misses errors under `Unwrap() []error`.
- Keep the operation error when cleanup also fails. Add a meaningful cleanup error rather than replacing the original failure.
- Do not join the same failure repeatedly through several cleanup paths.
- Treat documented terminal cleanup differently. A rollback after successful commit is expected, not a new business failure.

## Worked example: borrow a stream, own a file

- `CountLevels` consumes consecutive JSON objects, separated by optional JSON whitespace. It is not limited to newline-delimited records.
- Each object requires a nonempty string `level`. Missing, null, empty, and wrong-type levels fail.
- Unknown fields are ignored intentionally. A richer event can include fields this report does not use.
- Current `encoding/json/v2` matches field names case-sensitively. The example requires `level`, not a differently cased alias.
- Its underlying `jsontext.Decoder` rejects duplicate object names and invalid UTF-8 by default.
- Ignoring unknown fields does not disable those syntax checks. Application-level schema validation remains a separate decision.
- Empty input returns an empty map. Any decoding or validation failure returns nil counts, never a partial report.
- `CountLevels` borrows its reader and does not close it. The caller keeps the reader alive until consumption finishes.
- `CountFile` owns the file it opens. It includes the path and retains inspectable open, read, and meaningful close failures.
- No byte, record, or distinct-level budget is invented. Use this contract only when those input costs are acceptable.

```go
package eventlog

import (
	"encoding/json/jsontext"
	"encoding/json/v2"
	"errors"
	"fmt"
	"io"
	"os"
)

// CountLevels counts levels in a stream of JSON objects.
// Each object must contain a nonempty string level; unknown fields are ignored.
// CountLevels borrows r. On failure, it returns nil counts.
func CountLevels(r io.Reader) (map[string]int, error) {
	counts := make(map[string]int)
	decoder := jsontext.NewDecoder(r)
	for record := 1; ; record++ {
		var event struct {
			Level string `json:"level"`
		}
		err := json.UnmarshalDecode(decoder, &event)
		if err == io.EOF {
			return counts, nil
		}
		if err != nil {
			return nil, fmt.Errorf("decode event %d: %w", record, err)
		}
		if event.Level == "" {
			return nil, fmt.Errorf("event %d: level must be a nonempty string", record)
		}
		counts[event.Level]++
	}
}

// CountFile counts levels in path and closes the file before returning.
// On any failure, including close failure, it returns nil counts.
func CountFile(path string) (counts map[string]int, err error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("open event log %q: %w", path, err)
	}
	defer func() {
		if closeErr := file.Close(); closeErr != nil {
			counts = nil
			err = errors.Join(err, fmt.Errorf("close event log %q: %w", path, closeErr))
		}
	}()

	counts, err = CountLevels(file)
	if err != nil {
		return nil, fmt.Errorf("count event log %q: %w", path, err)
	}
	return counts, nil
}
```

- Named results in `CountFile` serve one purpose: deferred cleanup can change the result before the caller receives it.
- A bare `defer file.Close()` releases the resource but cannot add its failure to the returned error.
- File acquisition and stream interpretation stay separate. The same counting function can consume an already-open file or a request body.
- The map stays private until complete success. This makes “no partial report” a small boundary contract rather than caller bookkeeping.
- A stream containing one valid object followed by malformed input fails. Decoding only once would silently accept that trailing failure.
- A large valid message field does not hit Scanner's token limit. The decoder can still allocate for large input values.
- Use current `json/v2.UnmarshalDecode` with `jsontext.NewDecoder` for this new streaming parser.
- For strict unknown-member validation, use `json.RejectUnknownMembers(true)`. That deliberately changes this example's extensible input contract.
- Record-size budgets need an explicit parsing policy; syntax strictness alone does not provide resource bounds.
- Keep `encoding/json` v1 for existing wire contracts that require its compatibility behavior, not as the new default.
- A migration must review differences such as duplicate names, UTF-8, field matching, and representation rather than only changing imports.
- A deadline around an arbitrary `io.Reader` cannot interrupt a blocking read by itself. Use a concrete interruptible resource when required.

The following caller fragment assumes `err` comes from `CountFile` and imports `errors`, `fmt`, and `encoding/json/jsontext`.
It distinguishes a structured cause without parsing the added path or event-number text.

```go fragment
if syntax, ok := errors.AsType[*jsontext.SyntacticError](err); ok {
	fmt.Printf("invalid JSON near byte %d\n", syntax.ByteOffset)
}
```

## Progress and failure can arrive together

| Operation | Contract | Correct interpretation |
| --- | --- | --- |
| `Reader.Read` | Can return short data without error | One read is not one complete record. |
| `Reader.Read` | Can return positive `n` and an error | Process the returned bytes before handling the error. |
| `Reader.Read` | Can return zero and nil | No progress is not EOF. |
| `io.ReadFull` | Requires the requested number of bytes | Distinguishes no input from a truncated fixed-size record. |
| `io.Copy`, `io.ReadAll` | Read until EOF; successful EOF becomes nil | Check returned progress and any other error. |
| `Writer.Write` | Must return an error when `n < len(p)` | Preserve the count; do not repeat an already-written prefix. |
| `bufio.Writer.Write` | May only fill its buffer | Check `Flush` before reporting that bytes reached the underlying writer. |

- Reader implementations return `io.EOF` itself for graceful end, not an error wrapping EOF.
- Unexpected truncation in a structured stream needs `io.ErrUnexpectedEOF` or a more specific failure.
- Reader and Writer implementations must not retain the supplied byte slice.
- `io.Reader` does not imply cancellation, seeking, replay, concurrency safety, or ownership of a closer.
- `io.Closer` alone does not promise idempotent close. Check the concrete resource's contract.
- Buffered flush is not a durable-storage guarantee. A file protocol requiring durability needs its own synchronization and replacement semantics.

A reader-loop fragment assumes `r`, `buffer`, and `consume` exist.
The incorrect branch discards final bytes when a read returns data together with EOF or another error.

```go fragment
// Incorrect: r can return useful bytes and a non-nil err together.
n, err := r.Read(buffer)
if err != nil {
	return err
}
return consume(buffer[:n])
```

- The corrected loop first consumes `buffer[:n]`, then interprets the read error.
- Keep a non-EOF error observable even if the final bytes are useful.
- Prefer `io.Copy` or `io.ReadFull` when their complete operation matches the contract; do not rebuild their loops without a reason.

### Choose text-stream framing deliberately

- Scanner is convenient when its split function, token bound, and irreversible consumption fit the operation.
- Scanner's default maximum token buffer is `bufio.MaxScanTokenSize`. Delimiters can reduce the actual accepted token length.
- This is a library default, not a recommended application limit. Configure `Buffer` before scanning from an explicit input policy.
- The effective buffer bound also depends on the capacity of the supplied buffer.
- After `Scan` returns false, check `Err`. Normal EOF returns nil; oversized tokens and I/O failures do not.
- Scanner can read beyond the last returned token. Restarting with a larger Scanner does not reliably resume an oversized record.
- `Scanner.Bytes` is borrowed storage. Copy retained tokens before the next scan, particularly before sending them to workers.
- `ReadString` and `ReadBytes` return useful final data with EOF, including an unterminated final record.
- These methods can allocate a whole record. They are not inherently bounded-memory replacements for Scanner.
- `ReadSlice` supports fragment processing with `ErrBufferFull`; its bytes expire at the next I/O operation.
- Use structured decoders for structured streams, exact reads for fixed-size records, and fragment processing when whole-record storage is unsuitable.

### Make resource limits and truncation visible

- `ReadAll` has no application byte budget. Whole-input allocation must fit the input contract.
- `LimitReader` returns EOF at its limit. Successful reading does not distinguish exact fit from excess input.
- A preview may truncate intentionally. A complete document parser must not label that same truncation as complete success.
- Detect excess with an explicit policy, such as a checked extra-byte probe when that extra read is permitted.
- For incoming HTTP request bodies, `http.MaxBytesReader` reports exceeding its configured limit rather than silently substituting EOF.
- A retained-byte budget differs from a network-byte budget, decompressed-size budget, and elapsed-time budget. Name the one being enforced.

## HTTP: status, body, and lifetime are separate

- Reuse `http.Client` and `http.Transport`; they own connection pools and support concurrent requests.
- Configure shared instances before concurrent use rather than racing mutations of their fields.
- `Client.Do` reports transport or client-policy failure. A non-2xx HTTP response does not itself produce an error.
- Define acceptable statuses for the operation. A success status can still precede a truncated or invalid body.
- When Do returns nil error, the response body is non-nil and the caller must close it, including status-error paths.
- When Do returns an error, a returned response can normally be ignored; redirect rejection already closes its body.
- `ErrUseLastResponse` deliberately returns a response with an unclosed body and nil error. The caller still owns that body.
- Outgoing request context covers connection acquisition, request sending, response headers, and body reads.
- `Client.Timeout` includes redirects and body reading after Do returns. Zero means no overall timeout.
- `ResponseHeaderTimeout` does not bound body reading. `IdleConnTimeout` does not bound an active request.
- Set budgets from the caller or established service policy. Streaming and finite-response operations can need different lifetime rules.

### Worked contrast: a response outlives its helper call

This incorrect fragment assumes a helper returning `*http.Response` and receiving `parent` and a caller-selected `budget`.
Its deferred cancel runs before the caller consumes the body.

```go fragment
ctx, cancel := context.WithTimeout(parent, budget)
defer cancel()
request, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
if err != nil {
	return nil, err
}
return client.Do(request) // Body reads still depend on ctx after this return.
```

- If the helper owns the entire operation, read or decode the body and close it before canceling.
- If the caller owns consumption, let the caller own the request context, or explicitly transfer cancellation and body ownership together.
- Close each response within its iteration when an outer deferred close would retain many bodies.
- Preserve a read failure instead of returning a complete-looking partial payload.

### Reuse is an optimization, not an unlimited-drain obligation

- Current Go automatically tries to drain unread HTTP/1 response content asynchronously on Close, up to a conservative internal limit.
- Older advice requiring unconditional manual draining does not describe current behavior completely.
- Close remains required. It does not guarantee complete draining, immediate draining completion, or connection reuse.
- Do not read an arbitrary or endless error body merely to preserve one connection.
- Capture diagnostic bodies only under the caller's explicit size, lifetime, and disclosure policy.
- Transport retries are not an application retry policy. Consider replayable request bodies, idempotency, and uncertain remote effects.
- A timeout does not prove that a remote write never happened.

## SQL: keep iteration and transaction failures visible

- `sql.DB` is a long-lived concurrent-safe pool. It is not a transaction connection.
- Opening a DB need not connect. Use `PingContext` when the operation needs connection verification.
- Choose pool settings from the application's workload and existing policy, not copied example constants.
- Query success returns live Rows. Establish close ownership immediately, including early return and scan-failure paths.
- Call `Next` before each `Scan` and check each Scan error.
- `Next` false means exhaustion or iteration failure. Check `Rows.Err` before reporting success.
- `Rows.Err` is not a replacement for direct conversion-error handling from Scan.
- `Rows.Close` is idempotent and does not erase `Rows.Err`. Final exhaustion closes rows when no further result sets remain.
- Explicit Close can report meaningful batch, write, or autocommit errors. Retain these where they affect the operation's success.
- `QueryRowContext` returns a non-nil Row and defers errors until Scan. No row produces `sql.ErrNoRows`.
- `RawBytes` expires at the next Next, Scan, or Close. A custom `sql.Scanner` must copy driver-owned byte data it retains.
- Do not return live rows while canceling their context at helper return.
- Context cancellation depends on driver support. It does not universally prove that the remote server has stopped the query.

### Worked contrast: one transaction versus two connections

- Suppose an operation reserves inventory and records an order. Both writes must share one transaction.
- Call `BeginTx`, establish rollback cleanup, perform both operations through Tx, and check Commit.
- Calling `db.ExecContext` for the second write executes outside the transaction, even if it uses the same context.
- That escaped write can survive rollback or wait for another pooled connection while the transaction holds the available connection.
- Use Tx methods, not manual BEGIN/COMMIT SQL, to preserve the package's connection and transaction lifecycle.
- BeginTx's context lasts until commit or rollback. Its cancellation initiates rollback; Done is not a rollback-completion signal.
- Commit success confirms the transaction results. On commit failure, do not return a successful business result.
- A lost commit reply can leave an uncertain outcome. Use the backend's contract and application idempotency or reconciliation before retrying.
- Deferred Rollback after successful Commit is expected cleanup. After Commit or Rollback, further transaction operations return `ErrTxDone`.
- If rollback itself fails meaningfully, retain the original operation error and the cleanup failure.
- Requested isolation and read-only modes depend on driver support; inspect the actual driver when these properties matter.

## Subprocesses: cancellation is not reaping

- `exec.Command` uses an executable and argument vector. It does not interpret shell syntax unless you explicitly run a shell.
- After successful Start, call Wait to release resources and observe the final result. Run combines those operations.
- Cmd is single-use. Create a new Cmd for another attempt.
- `CommandContext` defaults to killing the direct process when its context ends. Killing does not wait for actual exit or kill descendants.
- Customize Cancel before Start when the program supports a defined graceful shutdown protocol.
- Wait has one owner. Do not call it concurrently or from a custom Cancel function.
- Wait also joins package-managed stream copying where applicable. Independently created copy goroutines still need their own completion protocol.
- With StdoutPipe or StderrPipe, finish normal reading before Wait; using Run for that pipe pattern is incorrect.
- Drain stdout and stderr compatibly while the child runs. Sequential draining can deadlock when the other pipe fills.
- After an early parse failure, arrange interruption or closure and still reap the child. Merely returning abandons the live operation.
- `Output` and `CombinedOutput` collect output in memory. Use them only when that allocation fits the output contract.
- Reaching a capture budget needs a policy: continue discarding, interrupt the producer, or reject the operation. Stopping reads alone can block it.
- A successful process exit does not prove successful output delivery.

### WaitDelay has a precise boundary

- WaitDelay addresses delayed process exit after cancellation and pipes remaining open after process exit.
- Its timer starts when context ends or Wait observes process exit, whichever occurs first.
- Expiration can kill the direct process and close pipes. This can truncate output, so retain the resulting error.
- A zero WaitDelay can leave Wait awaiting EOF from pipes inherited by descendants.
- WaitDelay cannot universally interrupt a blocked custom Stdin.Read or Stdout/Stderr.Write.
- Use concrete interruptible endpoints and owned copying when arbitrary caller streams can block.
- Cancel's return value can affect Wait even after a successful exit; `os.ErrProcessDone` has documented special handling.
- Preserve `*exec.ExitError` and I/O errors instead of replacing every result with `ctx.Err()`.
- Whole-process-tree termination needs platform-specific containment. A context alone does not provide that guarantee.

## Panic and reporting boundaries

- Use errors for expected operational failures. Panic can express documented misuse or an internal invariant violation.
- A directly called deferred recovery function can recover only a panic on its own goroutine.
- Recovery unwinds the failed call; it does not resume at the panic site or restore damaged shared invariants.
- Recover only at an intentional isolation boundary with meaningful reporting. Do not convert arbitrary panics into success.
- HTTP server recovery covers the active handler call, not arbitrary child goroutines it starts.
- Libraries usually return errors and leave process exit to the command boundary. `log.Fatal` exits the process and skips deferred cleanup.
- Report an error at the layer accountable for the outcome. Logging and returning at every layer produces repeated reports.
- Prefer structured `log/slog` attributes for source, operation, and identifiers. Decide whether a boundary reports or returns the failure.
- Keep sensitive payloads and credentials out of diagnostic fields. Better structure does not make data safe to disclose.
- Use [packages and APIs](packages-and-apis.md) for public error documentation and abstraction boundaries.
- Use [testing and performance](testing-and-performance.md) for observing real failure, cleanup, and consumer behavior.

## Sources

| Source | Decisions supported |
| --- | --- |
| [errors](https://pkg.go.dev/errors), especially Is, AsType, As, Join, and Unwrap | Error trees, matching, typed extraction, aggregation. |
| [Working with Errors: Whether to Wrap](https://go.dev/blog/go1.13-errors#TOC_3.3.) | Wrapping as a public API decision; use current package docs for tree semantics. |
| [FAQ: nil errors](https://go.dev/doc/faq#nil_error) | Nil interfaces versus nil concrete pointers. |
| [io](https://pkg.go.dev/io), especially Reader, Writer, EOF, ReadFull, LimitReader, and Closer | Partial progress, termination, buffering boundaries, interface limits. |
| [bufio](https://pkg.go.dev/bufio), especially Scanner, Buffer, Bytes, ReadSlice, and Flush | Token limits, borrowed bytes, alternatives, late write failures. |
| [encoding/json/v2](https://pkg.go.dev/encoding/json/v2), especially UnmarshalDecode, Unmarshal, and RejectUnknownMembers | Current stream decoding, case-sensitive field behavior, and schema choices. |
| [encoding/json/jsontext](https://pkg.go.dev/encoding/json/jsontext), especially Decoder and SyntacticError | Streaming syntax, inspectable failures, UTF-8 and duplicate-name rules. |
| [net/http](https://pkg.go.dev/net/http), especially Client.Do, Client.Timeout, Response.Body, and NewRequestWithContext | Status, body ownership, request lifetime, and current draining. |
| [Go 1.27 net/http changes](https://go.dev/doc/go1.27#net/http) | Why older unconditional manual-drain advice needs qualification. |
| [database/sql](https://pkg.go.dev/database/sql) and [driver context interfaces](https://pkg.go.dev/database/sql/driver) | Rows, scan errors, pool and transaction lifetimes, driver obligations. |
| [Executing transactions](https://go.dev/doc/database/execute-transactions) | Tx-only operations, commit results, rollback cleanup. |
| [os/exec](https://pkg.go.dev/os/exec) and [Process.Kill](https://pkg.go.dev/os#Process.Kill) | Start/Wait, stream ownership, Cancel, WaitDelay, descendant limits. |
| [Specification: handling panics](https://go.dev/ref/spec#Handling_panics) and [Defer, Panic, and Recover](https://go.dev/blog/defer-panic-and-recover) | Stack unwinding, recovery, cleanup, and error-return conventions. |
| [log/slog](https://pkg.go.dev/log/slog) and [log.Fatal](https://pkg.go.dev/log#Fatal) | Structured reports and process-exit behavior. |
