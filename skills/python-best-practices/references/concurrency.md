# Concurrency

- Read this reference when introducing or changing async work, threads, processes, task lifetimes, or admission control.
- Choose an execution model from the workload. Then define ownership, failure policy, cancellation, and capacity separately.
- Concurrency can overlap waiting. It does not automatically reduce CPU work or make blocking calls cooperative.
- Keep the project's existing runtime and framework unless the task requires a change.
- Examples target Python 3.15. Honor an existing project's declared compatibility requirements.
- For detailed context-manager and borrowed-resource contracts, read [errors and resources](errors-and-resources.md).

## Choose the execution model from the work

Sources: [asyncio tasks](https://docs.python.org/3.14/library/asyncio-task.html), [`to_thread`](https://docs.python.org/3.14/library/asyncio-task.html#asyncio.to_thread), [executors](https://docs.python.org/3.14/library/concurrent.futures.html), [free-threading](https://docs.python.org/3.14/howto/free-threading-python.html).

| Workload and context | Starting choice | Reason and qualification |
| --- | --- | --- |
| Straight-line work without useful overlap | Synchronous code | Avoid task coordination without a demonstrated need. |
| Many independent waits through async APIs | The existing async runtime | Cooperative I/O lets other tasks run while one waits. |
| Blocking I/O required by an async caller | Thread offload or a suitable async API | Keep blocking calls off the event-loop thread; preserve worker ownership. |
| CPU-bound Python on a GIL-enabled interpreter | Processes, a suitable native implementation, or another measured strategy | Threads usually do not provide parallel execution of Python bytecode. Processes add transfer and startup costs. |
| Native computation that releases the GIL | Threads can provide parallelism | Confirm the extension's behavior and thread-safety contract. |
| CPU work on a free-threaded interpreter | Threads can provide parallelism | Confirm the build, GIL state, extensions, and actual workload behavior. |

- `async def` changes the calling contract. It does not move synchronous code to a worker.
- Direct blocking I/O or long computation inside a coroutine blocks its event-loop thread.
- Even an `await` need not suspend when its awaitable completes immediately. Responsiveness depends on real suspension opportunities.
- Prefer a supported async client when it fits the existing application. Do not wrap every call in a new thread by habit.
- Processes require deliberate data transfer, worker initialization, and lifecycle ownership. Do not assume they share ordinary Python state.
- Measure the real workload before adding concurrency for speed. Read [verification and performance](verification-and-performance.md) for measurement guidance.

## Give related tasks one owner and a failure policy

Sources: [task groups](https://docs.python.org/3.14/library/asyncio-task.html#task-groups), [`gather`](https://docs.python.org/3.14/library/asyncio-task.html#asyncio.gather), [task creation](https://docs.python.org/3.14/library/asyncio-task.html#asyncio.create_task).

- Use `TaskGroup` when related operations share one lifetime and should fail together.
- Register each owned child through the group. A child's unrelated `asyncio.create_task()` call does not join that group automatically.
- Normal group exit waits for all registered children.
- A non-cancellation child failure requests sibling cancellation and waits for their cleanup before propagating failures.
- Ordinary child failures propagate in an `ExceptionGroup`. `KeyboardInterrupt` and `SystemExit` receive special propagation behavior.
- A child ending with `CancelledError` alone does not trigger the ordinary sibling-failure policy.
- Group failure is not a transaction. Effects already completed outside Python do not roll back automatically.

| Desired outcome | Suitable policy | Caller obligation |
| --- | --- | --- |
| Fail related work together | `TaskGroup` | Handle grouped failures at a meaningful boundary. |
| Collect independent successes and expected item failures | Explicit per-item outcomes within an owned lifetime | Define which failures become data and which abort the operation. |
| Propagate the first `gather()` failure | Default `asyncio.gather()` | Know that siblings continue; propagation does not cancel them. |
| Return all `gather()` outcomes | `gather(return_exceptions=True)` | Inspect every outcome. Do not report exception values as successful results. |
| Background work outliving a request | Application supervisor or another explicit owner | Retain task references, observe failures, and define shutdown. |

- Partial success needs an explicit result contract. Do not catch every exception simply to keep a group running.
- `except*` handles matching portions of an exception group; unmatched failures continue propagating.
- Keep cancellation and process-control exceptions outside routine item-error conversion.
- Holding a reference to a background task prevents premature loss of that reference. It does not define shutdown or observe failures.
- A task group owns task lifetimes, not the number of tasks allocated. Admission control remains a separate obligation.

## Cancellation is cooperative, not forced termination

Sources: [task cancellation](https://docs.python.org/3.14/library/asyncio-task.html#task-cancellation), [timeouts](https://docs.python.org/3.14/library/asyncio-task.html#timeouts).

- Cancellation requests delivery of `asyncio.CancelledError` at an opportunity to resume the task.
- Put cleanup in `finally` or an appropriate context manager so success, failure, and cancellation share cleanup paths.
- When catching `CancelledError` to add behavior, normally re-raise it after cleanup.
- `CancelledError` derives from `BaseException`, not `Exception`. Do not use a broad `BaseException` handler for normal recovery.
- Swallowing cancellation can break task-group and timeout behavior, or leave shutdown waiting indefinitely.
- Do not turn cancellation into a normal success value unless the API deliberately defines and owns that behavior.
- Code that never yields, blocks the loop, or suppresses cancellation can prevent prompt cancellation and group exit.
- A timeout triggers a cancellation policy. It does not guarantee a hard wall-clock stop or undo external effects.
- Cleanup can itself fail or receive another cancellation request. Give critical cleanup a bounded, explicit lifecycle policy when needed.
- `shield()` protects the inner awaitable from cancellation through its awaiter. It does not make the awaiter uncancellable.
- Shielded work still needs an owner that observes its result and keeps required resources alive.
- Verify cancellation with synchronization events and observed cleanup, not guessed scheduling delays.

## Admit work before allocating an unbounded task population

Sources: [task groups](https://docs.python.org/3.15/library/asyncio-task.html#task-groups), [asyncio queues](https://docs.python.org/3.15/library/asyncio-queue.html).

- Creating one task per item and acquiring a semaphore inside each task bounds active operations, not allocated tasks.
- For streamed or large input, limit admission before creating additional tasks or retaining additional queued items.
- Choose concurrency from configured policy and actual constraints, such as connection capacity, memory, rate limits, and downstream capacity.
- Do not guess a worker count, silently truncate valid input, or turn a nonpositive configuration into unlimited work.
- A concurrency bound limits simultaneous operations. It does not enforce requests per second.
- Document whether ordering matters. Overlapping operations generally complete in a different order from input traversal.

### Fixed workers over a lightweight synchronous source

- Use this pattern when advancing the synchronous source is quick and nonblocking.
- The caller supplies concurrency explicitly. A value below one is invalid caller policy and raises `ValueError`.
- One iterator supplies a fixed population of workers. Each worker advances it, then awaits one operation before taking another item.

```python
import asyncio
from collections.abc import Awaitable, Callable, Iterable


async def process_items[T](
    items: Iterable[T],
    operation: Callable[[T], Awaitable[None]],
    *,
    concurrency: int,
) -> None:
    """Process a nonblocking source with bounded, fail-together async workers."""
    if concurrency < 1:
        raise ValueError("concurrency must be at least 1")

    iterator = iter(items)

    async def worker() -> None:
        for item in iterator:
            await operation(item)

    workers: list[asyncio.Task[None]] = []
    async with asyncio.TaskGroup() as group:
        for _ in range(concurrency):
            workers.append(group.create_task(worker()))

    for task in workers:
        task.result()
```

- `process_items()` neither materializes the source nor allocates a task for every item.
- There are at most `concurrency` active `operation()` calls. Each worker retains its current item while awaiting that call.
- Workers share the iterator only on the same event-loop thread. No `await` occurs between advancing it and obtaining its item.
- This scheduling fact avoids a lock here. It does not make the iterator safe for cross-thread use.
- Source advancement and `operation()` must not reenter or independently consume the shared iterator.
- Source advancement must not perform blocking I/O or lengthy computation. Such work would block every worker on this loop.
- `operation()` must cooperate with cancellation and complete its cleanup before returning or propagating cancellation.
- Completion order and fairness between workers are unspecified. A callback that never suspends can let one worker consume many items.
- Source failures and non-cancellation callback failures cancel sibling workers through the group's failure policy.
- Parent cancellation propagates after the group's workers finish their cancellation cleanup.
- An independently cancelled worker does not trigger sibling cancellation. Other workers finish under the group's normal lifetime policy.
- Inspecting worker results then propagates that cancellation instead of returning as though every operation completed.
- Normal return means the source was exhausted and all admitted operations returned normally.
- Some operations can finish before failure or cancellation arrives. Finished external effects remain; there is no rollback.
- Other workers can admit more items before they observe a failure. This pattern does not promise an exact failure cutoff.
- The bound does not cover resources retained internally by the source or tasks detached inside `operation()`.
- The caller owns the source's resource lifetime. This function does not close a borrowed iterator when traversal stops early.
- Keep that owner outside the call; read [errors and resources](errors-and-resources.md) when the source holds an open stream.

### Use a queue when production needs its own stage

- Use a bounded queue when an async producer, transformation stage, or independently scheduled source feeds the workers.
- Configure both worker count and positive queue capacity from explicit policy.
- `asyncio.Queue(maxsize=0)` is unbounded; negative sizes are also unbounded.
- Await `put()` before advancing production further. Otherwise, backlog can move into producer tasks or another buffer.
- Count queued items, in-flight worker items, and producer-held items when reasoning about retained work.
- An item count does not bound bytes when item sizes vary.
- Give producer and workers one shutdown and failure scope. A failed consumer must not leave a producer blocked forever on `put()`.
- For normal producer completion, `queue.shutdown()` prevents new puts while consumers drain existing items.
- Consumers stop when `get()` raises `asyncio.QueueShutDown`. Keep that handler around acquisition, not unrelated processing.
- Shutdown does not own the workers. Join their tasks and propagate failures through the surrounding lifetime owner.
- Pair each successful `get()` with `task_done()` when using queue completion accounting, including failed processing paths.
- `join()` observes that accounting. It does not independently prove that business operations succeeded.
- Immediate queue shutdown can discard work and release a join. Do not interpret that release as successful processing.
- For stream output, await `drain()` as required for flow control. Repeated `write()` calls alone can accumulate buffered output.

## Thread offload does not stop when its awaiter is cancelled

Sources: [`asyncio.to_thread`](https://docs.python.org/3.14/library/asyncio-task.html#asyncio.to_thread), [`Future.cancel`](https://docs.python.org/3.14/library/concurrent.futures.html#concurrent.futures.Future.cancel), [executor shutdown](https://docs.python.org/3.14/library/concurrent.futures.html#concurrent.futures.Executor.shutdown).

- `await asyncio.to_thread(blocking_call, ...)` offloads execution and propagates the current `contextvars` context to the worker.
- Cancelling the awaiter does not forcibly stop a running thread. The blocking call can continue and change external state.
- Cancelling an executor future or requesting shutdown cancellation can cancel pending work, not an already running call.
- Task-group exit waits for its async children, not necessarily for underlying threads whose awaiters were cancelled.
- Keep resources alive until actual worker completion. Do not close a stream merely because its offload awaiter has ended.
- Let the worker own resources it can acquire and release entirely within the blocking operation when that fits the API.
- Borrowed resources need an explicit owner that tracks actual completion, including cancellation paths.
- For stoppable long-running work, define a cooperative stop signal and arrange observation of completion.
- A stop flag alone cannot interrupt an indefinitely blocked system or library call. Use supported interruption or timeout facilities.
- Do not promise that an async timeout means a threaded write did not happen. Retries need safe repetition or outcome reconciliation.
- Executor shutdown can wait for running work. Do not hide that wait in a supposedly prompt cancellation contract.
- Avoid workers waiting on work that requires the same exhausted executor. This can deadlock.

## Protect shared invariants, not just individual operations

Sources: [free-threading safety](https://docs.python.org/3.14/howto/free-threading-python.html#thread-safety), [asyncio synchronization](https://docs.python.org/3.14/library/asyncio-sync.html), [threading locks](https://docs.python.org/3.14/library/threading.html#lock-objects).

- Prefer task-local state, immutable messages, or one explicit state owner when they simplify coordination.
- A read followed by a decision and update is one application invariant, even when each individual operation is safe.
- In async code, an intervening `await` lets another task change shared state. Protect invariants that span suspension points.
- Use `asyncio` synchronization for tasks on one loop. These primitives are not cross-thread locks.
- Use thread-safe synchronization for shared thread state. Do not block the event loop waiting for a contended thread lock.
- Check the client or connection's concurrency contract before sharing it. Some resources require one user or one transaction owner.
- A GIL-enabled build does not make compound business operations atomic or protect resources in external systems.
- Optional free-threaded CPython builds exist from Python 3.13. The version number alone does not establish that the GIL is disabled.
- Extensions can affect GIL enablement. Check the actual interpreter and loaded extension behavior.
- Internal locking in built-in containers does not replace application-level synchronization.
- Neither free-threading nor a cache's thread safety guarantees exactly-once effects.

## Keep resource and runtime ownership visible

Sources: [asyncio runners](https://docs.python.org/3.14/library/asyncio-runner.html), [stream closure](https://docs.python.org/3.14/library/asyncio-stream.html#asyncio.StreamWriter.wait_closed), [task groups](https://docs.python.org/3.14/library/asyncio-task.html#task-groups).

- Acquire a shared client or other resource outside the task group that uses it. Close it after those tasks finish.
- This nesting keeps cleanup from racing with live users during success, child failure, and parent cancellation.
- A worker that opens its own resource owns its cleanup. A borrowed client stays under its caller's ownership contract.
- Resource closure may require an await, such as a stream writer's `wait_closed()`. A close request is not always completed closure.
- For acquisition failures, context managers, and borrowed versus owned streams, read [errors and resources](errors-and-resources.md).
- Expose an async API to callers that already own an event loop. Let them `await` the operation.
- Use `asyncio.run()` at a synchronous application entry point that owns the runtime.
- Do not call `asyncio.run()` from code already running a loop in the same thread.
- Frameworks, notebooks, and servers can own that loop. Integrate with their lifecycle rather than nesting another runtime.
- Do not close a caller-owned loop, executor, connection pool, or client.
- A synchronous wrapper needs an explicit runtime contract. Do not hide nested-loop patches or background threads behind an ordinary function call.
- Preserve the established async framework when it already supplies suitable structured lifetimes and cancellation.
- Successful completion means owned work has finished and its required cleanup is observable, not merely that tasks were scheduled.
