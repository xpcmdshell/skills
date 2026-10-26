# Testing and performance

Read this reference when defining acceptance checks, investigating concurrency, validating artifacts, or changing performance-sensitive Go code.

## Start with observable behavior

- Define integration or end-to-end acceptance checks before implementing a new feature.
- Drive the public operation through real files, process boundaries, network protocols, or other relevant components.
- Choose a few substantial workflows that expose important contracts. Do not manufacture test-count or coverage targets.
- Do not add unit tests, tests coupled to private implementation shape, or automatic regression tests for every fix.
- Verify results, external effects, useful errors, cleanup, and absence of unintended partial success.
- Use the actual dependency when its semantics matter. A mock database cannot establish driver cancellation or transaction behavior.
- Use a controlled local HTTP server to exercise real requests without depending on an unrelated public service.
- Use table-driven cases when several cases share a meaningful workflow. Do not force unrelated scenarios through a complicated table schema.
- Keep setup and assertions readable. Helpers should hide real fixture mechanics, not obscure what the scenario does.
- Assertions need an independent expected result or invariant, not a copy of the implementation's algorithm.

| Boundary | Useful evidence |
| --- | --- |
| Command | Built binary, arguments, unrelated working directory, stdout/stderr, exit status, and real input. |
| Library | Separate consumer importing the exported API and exercising real effects. |
| File transformation | Final contents, malformed input, write failure where relevant, and ownership of handles. |
| HTTP operation | Request semantics, status handling, body completion, cancellation, and cleanup. |
| Concurrent pipeline | Bounded admitted work, failures, stopping, joined workers, and safe input lifetime. |
| SQL workflow | Real driver and database behavior, rows completion, conversion errors, and commit or rollback outcome. |
| Distribution | Actual module or command artifact, resources, supported build configuration, and consumer resolution. |

## Synchronize tests instead of guessing timing

- Use channels, explicit readiness signals, and completion joins to coordinate concurrent integration scenarios.
- Do not use a wall-clock sleep as evidence that a goroutine has started or finished.
- Use `t.Context()` for work owned by a test. It is canceled before cleanup functions run.
- Use `t.Cleanup` for fixture resources. Cleanup runs in last-added-first order, so cancellation and joining must precede dependent teardown.
- A failed assertion must not leave a worker blocked on a result send or a server waiting forever for an abandoned request.
- Derive time budgets from the test runner or caller configuration rather than adding unexplained per-operation deadlines.
- `t.Parallel` is appropriate only for isolated fixtures. Global state, working-directory changes, and shared resources need a deliberate policy.
- Current `testing/synctest` provides an isolated concurrency environment with fake time and explicit `Wait` synchronization.
- Use it when the relevant components can run within its supported in-process blocking model.
- Real network and operating-system I/O do not become fake-time operations. Use real integration coordination for those boundaries.
- A passing race detector does not prove freedom from deadlocks, abandoned work, or incorrect ordering.
- Sources: [`testing.T`](https://pkg.go.dev/testing#T), [`testing/synctest`](https://pkg.go.dev/testing/synctest), [concurrency and context](concurrency-and-context.md).

## Example: verify the compiled command

- This test belongs in a separate consumer module.
- It exercises the `eventcount` binary from [modules and tooling](modules-and-tooling.md), including its embedded heading.
- Set `EVENTCOUNT_BINARY` to the absolute path of the built binary before running `go test`.
- The valid input contains an unterminated final record. The invalid input follows valid records and must not produce a partial report.

### `command_test.go`

```go fragment
package consumer_test

import (
	"bytes"
	"errors"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"testing"
)

func TestEventCountCommand(t *testing.T) {
	binary := os.Getenv("EVENTCOUNT_BINARY")
	if !filepath.IsAbs(binary) {
		t.Fatal("EVENTCOUNT_BINARY must be an absolute path to the built command")
	}
	path := filepath.Join(t.TempDir(), "events.json")
	input := []byte("{\"level\":\"info\"}\n{\"level\":\"error\"}\n{\"level\":\"info\"}")
	if err := os.WriteFile(path, input, 0o600); err != nil {
		t.Fatal(err)
	}
	invoke := func() (string, string, error) {
		command := exec.CommandContext(t.Context(), binary, path)
		command.Dir = t.TempDir()
		var stdout, stderr bytes.Buffer
		command.Stdout = &stdout
		command.Stderr = &stderr
		err := command.Run()
		return stdout.String(), stderr.String(), err
	}

	stdout, stderr, err := invoke()
	if err != nil || stderr != "" {
		t.Fatalf("successful input: error=%v stderr=%q", err, stderr)
	}
	if want := "Event counts\n{\"error\":1,\"info\":2}\n"; stdout != want {
		t.Fatalf("report = %q, want %q", stdout, want)
	}

	input = append(input, []byte("\n{\"level\":")...)
	if err := os.WriteFile(path, input, 0o600); err != nil {
		t.Fatal(err)
	}
	stdout, stderr, err = invoke()
	exitError, ok := errors.AsType[*exec.ExitError](err)
	if !ok || exitError.ExitCode() != 2 {
		t.Fatalf("malformed input: expected exit status 2, got %v", err)
	}
	if stdout != "" || !strings.Contains(stderr, path) {
		t.Fatalf("malformed input: stdout=%q stderr=%q", stdout, stderr)
	}
}
```

- The test checks a public contract, not private function names or a particular implementation of parsing.
- Extend the scenario only when another meaningful promise needs evidence, such as output replacement or a deployment-specific filesystem rule.

## Run checks that answer different questions

| Check | What it establishes | What it does not establish |
| --- | --- | --- |
| `gofmt` | Standard formatting. | Readable design or correct behavior. |
| `go build ./...` | Compilation for the selected configuration. | Runtime correctness or other targets. |
| `go vet ./...` | Selected static diagnostics. | A complete correctness proof. |
| `go test ./...` | The executed tests pass. | Missing scenarios or dependencies replaced by test doubles. |
| `go test -race ./...` | No detected race on the executed paths and schedules. | Race freedom, liveness, or ownership correctness. |
| Separate consumer and binary runs | The intended public artifact works in that environment. | Unexercised release or platform configurations. |
| Coverage | Statements reached by instrumented execution. | Semantic completeness, quality, or useful assertions. |

- Use the latest stable target unless the user requests another version or compatibility range.
- Add a version matrix only for requested compatibility. Keep deployment-platform checks tied to actual supported environments.
- Use `GOWORK=off` for standalone module and consumer checks when a workspace could hide missing dependencies.
- `go test` can reuse successful cached results. Use `-count=1` when the investigation needs a fresh execution.
- `-shuffle=on` can expose order-dependent tests. Preserve the reported seed when reproducing a failure.
- Match build tags, environment, and cgo settings to the actual workflow.
- Run the race detector on real instrumented workloads when tests do not exercise the relevant concurrent paths.
- Source: [`go test` and test flags](https://pkg.go.dev/cmd/go#hdr-Test_packages), [race detector](https://go.dev/doc/articles/race_detector).

## Use fuzzing for broad public input boundaries

- Fuzz public decoding, import, serialization, or protocol workflows when their input space benefits from exploration.
- Seed valid structured inputs so mutations reach meaningful behavior, not only the first rejection branch.
- Include malformed, truncated, empty, Unicode, and boundary-shaped inputs relevant to the actual format.
- Check application properties such as round-trip meaning, rejection without partial commit, resource completion, or agreement with an independent implementation.
- Round-trip success alone can hide matching encoder and decoder bugs. Add independent semantic evidence where needed.
- A fuzzer harness must isolate state between inputs and avoid hidden dependence on prior runs.
- Keep useful corpus inputs without secrets or unrelated personal data.
- Set fuzzing duration or iteration budgets from the requested investigation, not a universal recipe.
- Do not treat “no panic” as the complete acceptance criterion for a workflow that can silently corrupt data or hang.
- Source: [Go fuzzing](https://go.dev/doc/security/fuzz/).

## Measure before changing the design

- Start with a representative workload and an observed cost: latency, throughput, memory retention, allocation, contention, or startup.
- Use CPU profiles for CPU cost, heap profiles for allocation and retained memory, and block or mutex profiles for waiting.
- Use execution traces for scheduling, blocking, garbage collection, and interactions across goroutines.
- Use current goroutine and `goroutineleak` profiles to investigate stalled or leaked work. They do not prove the intended ownership contract.
- Enable diagnostic capture deliberately. Profile endpoints can expose stack traces, paths, and other sensitive application information.
- Keep diagnostic endpoints private or appropriately authenticated rather than adding them to a public application handler.
- Form a specific hypothesis before adding pools, caches, goroutines, unsafe code, or representation changes.
- Recheck results, error behavior, ordering, and resource lifetime after an optimization.
- Sources: [Go diagnostics](https://go.dev/doc/diagnostics), [`runtime/pprof`](https://pkg.go.dev/runtime/pprof), [`runtime/trace`](https://pkg.go.dev/runtime/trace), [Go 1.27 leak profiles](https://go.dev/doc/go1.27#runtime).

## Benchmark the operation you intend to improve

- Use current `testing.B.Loop` for ordinary benchmarks. Its loop separates timed iterations from setup and cleanup.
- Construct fixtures outside the timed loop unless construction belongs to the operation being measured.
- Keep parsing, copying, allocation, and I/O inside the loop when callers actually pay those costs.
- Do not benchmark an empty wrapper, cached result, or optimized-away computation instead of the real feature.
- Use `ReportAllocs` and `SetBytes` when allocation or byte throughput helps explain the workload.
- Compare equivalent inputs, concurrency, toolchain, environment, and result guarantees. Repeat measurements to assess variation.
- Use `benchstat` for a meaningful set of before/after results rather than presenting one timing as a stable improvement.
- `RunParallel` measures a different workload from serial execution. Its benchmark state and fixtures need a valid concurrency contract.
- Do not turn an isolated microbenchmark result into an end-to-end performance claim.

### `benchmark_test.go`

- This consumer benchmark uses the `eventlog` package from [modules and tooling](modules-and-tooling.md).
- It measures a cached local file workflow, including opening, decoding, aggregation, and closing.
- Use representative production-shaped fixtures when making a real performance decision; this compact fixture demonstrates benchmark structure.

```go fragment
package consumer_test

import (
	"os"
	"path/filepath"
	"testing"

	"example.com/eventlog"
)

func BenchmarkCountFile(b *testing.B) {
	input := []byte("{\"level\":\"info\"}\n{\"level\":\"error\"}\n{\"level\":\"info\"}\n")
	path := filepath.Join(b.TempDir(), "events.json")
	if err := os.WriteFile(path, input, 0o600); err != nil {
		b.Fatal(err)
	}
	b.ReportAllocs()
	b.SetBytes(int64(len(input)))
	for b.Loop() {
		counts, err := eventlog.CountFile(path)
		if err != nil {
			b.Fatal(err)
		}
		if counts["info"] != 2 || counts["error"] != 1 {
			b.Fatalf("incorrect result: %v", counts)
		}
	}
}
```

```sh
go test -run '^$' -bench '^BenchmarkCountFile$' -benchmem
go test -run '^$' -bench '^BenchmarkCountFile$' -cpuprofile cpu.out -memprofile heap.out
go tool pprof cpu.out
```

- Select `alloc_space` versus `inuse_space` when the question concerns allocation churn versus retained heap.
- `sync.Pool` is a temporary reuse mechanism, not a durable cache or an object lifetime guarantee.
- Buffer reuse must preserve ownership. A faster result that aliases memory later overwritten by a worker is incorrect.
- Compiler escape and inlining diagnostics help explain a profile; they are not a reason to optimize every allocation.
- Use profile-guided optimization with representative profiles when it addresses a measured need. Re-evaluate when workloads change.
- Sources: [`testing.B.Loop`](https://pkg.go.dev/testing#B.Loop), [`benchstat`](https://pkg.go.dev/golang.org/x/perf/cmd/benchstat), [`sync.Pool`](https://pkg.go.dev/sync#Pool), [profile-guided optimization](https://go.dev/doc/pgo).
