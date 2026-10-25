# Verification and performance

- Use this reference to design behavioral checks, verify delivered changes, or investigate slow or memory-heavy operations.
- Read [packaging and tooling](packaging-and-tooling.md) for environments, static checks, and installed-distribution verification.
- Read [concurrency](concurrency.md) when completion, cancellation, or concurrent state affects the result.

## Verify the public behavior

- Derive checks from what the application or library promises to its caller.
- For new features, design and write integration or end-to-end checks before implementing the feature.
- Exercise public operations and real effects rather than private helpers or the number of internal calls.
- Prefer a few substantial scenarios that cover interacting conditions over many isolated trivial assertions.
- Run relevant existing integration and end-to-end checks when fixing bugs.
- Test the requested behavior, not the exact implementation you expect to write.
- A refactor may change functions and module boundaries without changing the correct outcome.
- A shape-only assertion that fails on every valid refactor adds maintenance cost without establishing behavior.

| Feature | Observable evidence |
| --- | --- |
| CLI | Exit status, stdout, stderr, created artifacts, and effects on existing files. |
| Public library operation | Returned values, meaningful exceptions, input mutation, resource ownership, and supported caller forms. |
| Data transformation | Correct records, ordering where promised, missing-value handling, and declared malformed-input policy. |
| Persistent operation | Committed state and failure behavior observed through the real storage interface. |
| Concurrent operation | Completion, propagated failures, cleanup, and effects remaining after cancellation. |
| Distribution | Installed imports, commands, resources, dependencies, and public typing. |

- Test properties when they express the contract, such as preservation, idempotence, or a documented round trip.
- Do not assert a round trip when normalization intentionally changes the representation.
- Use test inputs that distinguish plausible wrong implementations, including valid false-like values and partial failures.
- Avoid coverage percentages or test counts as substitutes for useful evidence.

## Exercise real boundaries with controlled inputs

- Use temporary files and directories for filesystem behavior.
- Run CLIs as subprocesses, rather than only calling the function behind their entry point.
- Use a local service or real test instance when protocol behavior matters.
- Keep credentials, production state, and uncontrolled external services out of routine checks.
- Use a fake at a deliberate external boundary when a real dependency is impractical.
- A fake should preserve the relevant contract, including errors, ordering, and lifecycle behavior.
- Do not mock every internal layer; a chain of compatible mocks can pass while the real application cannot work.
- Avoid changing application architecture solely to expose private helpers to tests.
- Make nondeterministic inputs explicit where they affect correctness, such as a clock or random source at a real boundary.
- Use fixed seeds for reproducible scenarios without assuming one seed establishes general correctness.
- Keep test state isolated, and clean up processes, clients, temporary data, and background work.

## Check failure and cleanup as outcomes

- Include failures after partial progress, not only failures before any work starts.
- Verify which effects remain, which effects are rolled back, and which resources remain usable.
- A callback finishing does not prove that buffered output was flushed or a transaction committed.
- A raised timeout does not prove that a worker or child process stopped.
- A file disappearing from a directory does not prove that its descriptor closed on every platform.
- Observe the promised lifecycle through a suitable public interface or the underlying resource.
- For borrowed streams, check that the caller can still use them after the operation returns.
- For owned resources, check cleanup on success, failure, and early consumer exit.

## Coordinate concurrent checks explicitly

- Use events, barriers, queues, or other synchronization to place work at the state the scenario needs.
- Do not use arbitrary sleeps to guess that a worker has started or cleanup has finished.
- Observe task completion after requesting cancellation.
- Test failure policy deliberately: fail-together work and partial-success collection have different correct outcomes.
- Separate active-work limits from admitted-work limits; both can affect memory and lifecycle.
- Distinguish an intentionally running external worker from a leaked task or a falsely reported cancellation.
- Configure any test deadline from the execution environment’s policy, and report deadline failures as such.
- Do not alter product behavior with guessed limits to make a test finish faster.

## Example: verify a packaged CLI through its process interface

- This example assumes an installed `event_report.cli` module that accepts a JSON Lines file path.
- Its contract prints event counts in level-name order and a heading stored as package data.
- Malformed input produces exit status 2, a source location on stderr, and no partial report on stdout.
- The check runs from a temporary working directory, outside the source checkout.
- The child uses UTF-8 mode so its redirected output matches the parent's decoder.

```python
import subprocess
import sys
from pathlib import Path


def test_event_report_cli(tmp_path: Path) -> None:
    source = tmp_path / "événements.jsonl"
    source.write_text(
        '{"level": "warning"}\n{"level": "info"}\n{"level": "warning"}\n',
        encoding="utf-8",
    )
    command = [
        sys.executable,
        "-I",
        "-X",
        "utf8",
        "-m",
        "event_report.cli",
        str(source),
    ]
    success = subprocess.run(
        command,
        cwd=tmp_path,
        capture_output=True,
        text=True,
        encoding="utf-8",
        check=False,
    )
    assert success.returncode == 0, success.stderr
    assert success.stdout == "Event totals\ninfo: 1\nwarning: 2\n"
    assert success.stderr == ""

    source.write_text(
        '{"level": "info"}\ninvalid-json\n',
        encoding="utf-8",
    )
    failure = subprocess.run(
        command,
        cwd=tmp_path,
        capture_output=True,
        text=True,
        encoding="utf-8",
        check=False,
    )
    assert failure.returncode == 2, failure.stderr
    assert failure.stdout == ""
    assert str(source) in failure.stderr
    assert ":2:" in failure.stderr
```

- Exact output assertions are appropriate here because ordering and presentation are part of this CLI’s stated contract.
- The input and output are small, so capture is appropriate. Streaming behavior needs a different scenario.
- Add the relevant resource, dependency, or platform cases when those contracts are part of the change.

Source: [pytest integration practices](https://docs.pytest.org/en/stable/explanation/goodpractices.html).

## Treat tools as complementary checks

- Formatting checks consistency; linting finds selected suspicious patterns; type checking examines declared and inferred contracts.
- None of those establishes complete runtime correctness.
- Run tools with the actual project configuration and supported Python target.
- A clean result from excluded files or suppressed imports is not evidence that those areas were checked.
- Read the failure before changing code. Incorrect environments and invalid assumptions can produce misleading diagnostics.
- Report which checks ran and what they established, without presenting missing verification as a product limitation.

## Measure before choosing an optimization

1. Define the workload and the outcome that needs improvement.
2. Establish correct outputs and relevant side effects before changing performance-sensitive behavior.
3. Measure elapsed time, throughput, memory, or another metric that matches the problem.
4. Locate the dominant cost with profiling or suitable system observations.
5. Change the relevant algorithm, data movement, I/O, representation, or coordination.
6. Repeat measurements under comparable conditions and verify behavior again.

| Dominant cost | Investigate |
| --- | --- |
| Repeated scanning or sorting | Algorithm choice, indexing, and avoidable repeated work. |
| Network or storage round trips | Batching, reuse, request shape, and protocol behavior. |
| Retained memory | Materialization, object lifetime, queues, caches, and duplicate representations. |
| CPU-heavy Python execution | Algorithms, suitable native operations, and execution models supported by the deployment. |
| Coordination | Lock scope, contention, task admission, and work granularity. |

- Do not optimize a comprehension while database requests dominate the operation.
- Profile to locate costs; benchmark representative work to compare outcomes.
- Instrumentation introduces overhead and can distort the timing comparison.
- Separate startup, warm caches, cold caches, and steady-state behavior when they affect the result.
- Repeat measurements enough to understand variation; do not report a noisy difference as an established improvement.
- Compare the same input, interpreter, dependency versions, hardware conditions, and resource policy where practical.
- Document a remaining tradeoff when faster execution changes memory, ordering, latency, or caller requirements.

## Choose optimizations that fit the contract

- Reuse built-in operations and established libraries before writing custom performance machinery.
- Improve algorithms and avoid repeated external work before adding clever syntax.
- Stream when it reduces unnecessary retention and the operation does not require replay or random access.
- Materialize when stable snapshots, repeated traversal, or indexing are part of the actual work.
- Cache only when values can be reused safely and retained objects fit an explicit memory policy.
- Choose concurrency from the workload and deployment. More tasks or threads do not guarantee better throughput.
- Keep output correctness and failure behavior in the comparison; faster wrong results are not an improvement.
- Do not reject otherwise valid input to satisfy an invented performance threshold.

Sources: [Python profiling](https://docs.python.org/3.14/library/profile.html), [collection costs](https://docs.python.org/3.14/library/collections.html), and [cache behavior](https://docs.python.org/3.14/library/functools.html#functools.lru_cache).
