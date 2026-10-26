# Concurrent work, context, and synchronization

Read this reference when launching tasks, changing shared state, propagating cancellation, or controlling admission.
Use [errors and I/O](errors-and-io.md) for stream, HTTP, SQL, and subprocess interruption contracts.
Use [values and types](values-and-types.md) for aliasing, slice storage, and iterator value lifetimes.

## Start with ownership, not a goroutine

- A goroutine runs independently. Returning from its caller does not stop it or wait for it.
- Before launching work, identify its owner, normal completion, stopping mechanism, completion signal, and error destination.
- The owner keeps resources alive until all users finish. It joins work before claiming completion or reusing shared buffers.
- Finite independent work can finish naturally. Long-lived service work needs a service-owned shutdown protocol.
- Request work normally stays inside its request lifetime. Detached work requires an explicit ownership transfer, not merely `go`.
- Goroutines are not garbage-collected because their handles become unreachable. They must exit.
- Choose concurrency because overlapping waits or parallel work serves the operation, not because a function can be launched asynchronously.

| Need | Suitable starting point | Boundary to preserve |
| --- | --- | --- |
| One sequential operation | An ordinary function call | No independent lifecycle is needed. |
| Completion without task errors | `sync.WaitGroup.Go` | Register before waiting; task must not panic. |
| Related tasks that can fail | `errgroup.WithContext` | Error policy, cancellation cooperation, and joining. |
| Transfer values or signal readiness | Channels | Sender/receiver ownership and value lifetime. |
| Protect related mutable state | A mutex | Every conflicting access and the entire invariant. |
| Publish a stable snapshot or update one atomic value | Typed `sync/atomic` operations | Pointee lifetime and compound invariants remain separate. |

## Worked example: bounded work over a sequence

- `ForEach` accepts standard `iter.Seq[T]`, an explicit positive concurrency, and a context-aware operation.
- Dependencies: current Go 1.27 and `golang.org/x/sync v0.24.0`.
- One producer owns source advancement and channel closure. Fixed workers receive jobs through an unbuffered channel.
- At most `concurrency` callbacks execute, plus one value held by the producer awaiting delivery.
- No per-item goroutine or guessed queue size is needed. The example does not limit retained callback results or external resources.
- Use this helper with nonblocking sequence advancement and cleanup, such as iteration over in-memory values.
- The sequence must stop when yield returns false. It must not wait on I/O or other goroutines.
- Work must honor cancellation and return after releasing its owned resources. This function cannot force arbitrary work to stop.
- Every yielded value must remain valid independently of the next yield and source cleanup until its callback finishes.
- A source reusing byte storage must yield owned copies, such as `bytes.Clone(token)`, before asynchronous dispatch.
- Source resources remain caller-owned and must outlive ForEach. No task may retain those resources after its callback returns.
- The first non-nil task error stops related work cooperatively and remains inspectable. All owned tasks finish before return.
- Parent cancellation cannot become normal completion, including an empty source or callbacks that return nil after cancellation.

```go
package work

import (
	"context"
	"fmt"
	"iter"

	"golang.org/x/sync/errgroup"
)

// ForEach calls work concurrently for values, with at most concurrency calls active.
// concurrency must be positive. Callbacks must return rather than panic.
//
// Sequence advancement and cleanup must not block on I/O or other goroutines.
// Callbacks must honor cancellation. Values must remain valid independently of
// subsequent yields and source cleanup until work returns.
// The caller owns source resources and keeps them alive until ForEach returns.
// ForEach waits for every owned task. It returns the first task error, or the
// parent's cancellation error if tasks complete without reporting an error.
func ForEach[T any](ctx context.Context, values iter.Seq[T], concurrency int, work func(context.Context, T) error) error {
	if concurrency <= 0 {
		return fmt.Errorf("concurrency must be positive: %d", concurrency)
	}
	if err := ctx.Err(); err != nil {
		return err
	}

	group, taskCtx := errgroup.WithContext(ctx)
	jobs := make(chan T)
	group.Go(func() error {
		defer close(jobs)
		for value := range values {
			if err := taskCtx.Err(); err != nil {
				return err
			}
			select {
			case jobs <- value:
			case <-taskCtx.Done():
				return taskCtx.Err()
			}
		}
		return nil
	})
	for range concurrency {
		group.Go(func() error {
			for {
				select {
				case <-taskCtx.Done():
					return taskCtx.Err()
				case value, ok := <-jobs:
					if !ok {
						return nil
					}
					if err := taskCtx.Err(); err != nil {
						return err
					}
					if err := work(taskCtx, value); err != nil {
						return fmt.Errorf("process value: %w", err)
					}
				}
			}
		})
	}
	if err := group.Wait(); err != nil {
		return err
	}
	return ctx.Err()
}
```

### What the boundary guarantees

- `group.Wait` joins the producer and workers. Their cleanup completes before ForEach returns.
- Returning from the range loop causes the sequence's yield call to return false, allowing cooperative iterator cleanup.
- The producer alone closes jobs. Workers never close a channel another goroutine can still send on.
- Workers inspect cancellation before invoking work, reducing unnecessary dispatch after cancellation becomes visible.
- Cancellation can race with dispatch. This code does not promise an atomic “no new callback after cancellation” boundary.
- The unbuffered send provides backpressure. The producer cannot enumerate an unbounded source ahead of occupied workers.
- The final check uses the parent context, not taskCtx. Errgroup cancels taskCtx even when Wait succeeds.
- The first reported task error wins, including cancellation reported by the producer or a worker.
- A later callback failure does not replace an earlier cancellation error. Concurrent errors need not follow input order.
- An error does not undo callbacks that already succeeded. Add transactions or idempotency only when the domain requires them.
- The sequence type has no inherent producer-error result. A fallible source needs an explicit error-bearing input or another reporting contract.
- This contract assumes non-nil context, sequence, and callback. It validates concurrency because zero has no useful worker interpretation here.

### What it cannot guarantee

- An existing sequence does not receive taskCtx. A source watching only the parent context cannot observe callback-triggered group cancellation.
- Do not pass a blocking sequence merely because it accepts the parent context. Its read could outlive the callback failure.
- For blocking or fallible sources, give an owned producer the group's context and an explicit error-return contract.
- Cancellation cannot interrupt arbitrary iterator code blocked before its next yield.
- Adding a goroutine around that iterator would only move the blocked work; returning early would abandon the owned task.
- Cooperative work can still have delayed cleanup. A deadline signals the budget, not forced completion by that instant.
- A shallow copy of T can retain pointers or slices into source storage. Generic code cannot infer the required deep copy.
- A Seq cursor valid only during yield cannot be sent directly to asynchronous work under this contract.
- A callback that starts detached goroutines must own and join them itself. ForEach joins callbacks, not hidden unregistered descendants.

## Context carries lifetime, not completion

- Pass context explicitly, normally first, through dependent calls. Do not replace a request context with Background to conceal cancellation.
- Keep per-call contexts out of long-lived service structs. A service can own shutdown state without capturing one caller's request lifetime.
- Context values carry request-scoped information across APIs. They are not substitutes for ordinary required parameters or service dependencies.
- Context methods are concurrent-safe. Mutable objects stored as values still need their own synchronization.
- The creator of a derived cancellable context owns its cancel function unless ownership is explicitly transferred.
- Call cancel when its operation completes, including successful early completion, to release references and timers.
- Scope cancellation to the real operation. Deferring many cancels in a long outer loop retains work longer than necessary.
- A child deadline does not extend an earlier parent deadline. Choose additional budgets only from explicit caller or application policy.
- `context.TODO` marks a missing lifetime decision. It is not an improvement over a known caller context.

| Event | What it establishes | What it does not establish |
| --- | --- | --- |
| `cancel()` returns | Stopping is requested; context resources are released according to its contract | Workers have returned. |
| `ctx.Done()` closes | Cancellation is observable | Cleanup, rollback, or final writes have completed. |
| Callback's stop function returns | Its cancellation association may have been prevented | An already-started callback has finished. |
| `Wait` returns | Registered tasks have returned | Unregistered descendants or remote side effects have stopped. |
| Caller stops waiting | Caller has an outcome or budget result | Underlying work no longer owns resources. |

### Causes and deliberate lifetime changes

- `ctx.Err()` classifies cancellation or deadline expiration. `context.Cause(ctx)` can preserve a more specific reason.
- `WithCancelCause` records the first cancellation cause; canceling with nil uses `context.Canceled`.
- Parent-first and child-first cancellation can produce different causes. A later cause does not overwrite an established one.
- Deadline-cause constructors set their supplied cause when the deadline expires. Their returned cancel function does not set that supplied cause.
- Preserve the actual operation error instead of returning `ctx.Err()` after every unrelated failure.
- `WithoutCancel` retains values but removes the deadline and cancellation; its Done channel is nil and Cause returns nil.
- Use it only for an intentional lifetime transfer with a new owner, error destination, shutdown protocol, and applicable caller budget.
- Detached context is not durable job storage. Use an actual work system if work must survive process failure.
- Incoming HTTP request contexts end when the handler returns as well as on request cancellation.

### Worked contrast: stop an awaiter versus stop its work

The following incorrect fragment assumes a blocking `read`, a result channel `done`, and a context.
It stops waiting, but the read can still own its input and buffer after the function returns.

```go fragment
go func() { done <- read() }()
select {
case err := <-done:
	return err
case <-ctx.Done():
	return ctx.Err() // read has not necessarily stopped.
}
```

- A buffered result channel can unblock one final send. It does not make the read cancellable.
- Use a context-aware operation, a concrete deadline, or a documented close that interrupts the underlying I/O.
- Then join the worker before reusing its buffer or closing dependencies it still uses.
- If the dependency cannot be interrupted, state that limitation or transfer ownership to a real longer-lived component.
- Do not promise both prompt return and complete cleanup around an arbitrary uninterruptible operation.
- `context.AfterFunc` can arrange interruption, but its stop function does not join an already-started callback.
- Coordinate callback completion before restoring state such as connection deadlines. Otherwise a late callback can overwrite the restored state.
- Stop returning false can also mean the callback was previously stopped. Design one clear stop/completion owner rather than blindly waiting after every false result.

## Channels express a protocol

| State or action | Language behavior | Design consequence |
| --- | --- | --- |
| Nil channel | Send and receive cannot proceed | Disable a select case intentionally; all-nil cases without default block forever. |
| Closed channel with buffered data | Receivers drain queued values | Close does not discard work already sent. |
| Closed and empty channel | Receive returns zero with `ok == false` | Return or disable the case instead of repeatedly processing zero values. |
| Send to a closed channel | Panic | A receiver cannot close input merely because it stopped consuming. |
| Close nil or already-closed channel | Panic | Give closure one owner with proof that sending has ended. |
| Several ready select cases | Uniform pseudo-random selection | Cancellation is not a priority case. |
| Select channel and send-value operands | Evaluated before selecting a case | A send expression can perform expensive or blocking work before cancellation is selected. |

- Closing a data channel means no more values will be sent. It is not required for garbage collection.
- For multiple producers, a coordinator can close after joining all senders. “Every sender closes” is incorrect.
- `sync.Once` prevents duplicate close calls but does not prove all sends have ended.
- If a consumer stops early, unblock upstream senders through the shared stopping protocol or a proven complete buffer bound.
- Increasing a buffer to hide one blocked send is fragile when input or consumption changes.
- Sending a pointer or slice synchronizes communication but does not prevent later mutation through another alias.
- Channel capacity controls queued values, not total retained memory, active I/O, or unregistered goroutines.

A select fragment assumes `out`, `ctx`, and `build` exist.
It does not give build cancellation protection, even though the send has a cancellation alternative.

```go fragment
select {
case out <- build(): // build runs before select chooses a case.
case <-ctx.Done():
	return ctx.Err()
}
```

- Move substantive work into a context-aware operation with its own lifetime contract.
- If strict no-admission-after-stop semantics matter, serialize admission and stopping through a shared state protocol.
- An extra context precheck reduces unnecessary work but does not make cancellation and dispatch atomic.

## Completion and admission are different policies

### WaitGroup for completion

- Prefer `WaitGroup.Go` for launching tasks that need completion tracking without an error policy.
- Its function must not panic. WaitGroup does not provide error aggregation or context cancellation.
- The first Go call on an empty group must occur before Wait. An active task may add further work.
- Manual Add/Done remains useful when tracking work not launched by Go.
- A positive Add from zero must precede a wait that could observe zero; Add inside a newly launched goroutine races with early completion.
- A task waiting for its own group cannot complete while it remains counted.
- Reuse starts only after all previous Wait calls return. Never copy a WaitGroup after first use.

The fragment assumes `tasks` is a finite slice of `func()` values that return without panic.
It tracks completion without inventing cancellation or error behavior.

```go fragment
var group sync.WaitGroup
for _, task := range tasks {
	group.Go(task)
}
group.Wait()
```

### Errgroup for related failing tasks

- `WithContext` cancels the derived context on the first non-nil task error or when Wait returns.
- Wait joins registered tasks and returns the first non-nil task error. It does not aggregate every failure.
- A zero Group has no cancellation-on-error context and no concurrency limit.
- Parent cancellation alone does not force a non-nil Wait result when all tasks return nil. Check the public operation's cancellation contract.
- Do not use the derived context for successful post-group work; it is canceled after successful Wait too.
- Do not reuse a group for unrelated operations.
- Current errgroup does not recover panics and convert them into returned errors. Panic boundaries require separate intentional design.
- If all errors matter, collect them safely and define ordering or priority separately. `errors.Join` does not collect goroutine results automatically.

### SetLimit is blocking admission

- SetLimit bounds active group goroutines, not queued inputs, stored results, connections, or hidden descendants.
- Go blocks until a slot is available. Its admission wait does not select on group cancellation.
- A blocked submission can remain blocked after cancellation, or start later under an already-canceled context when a slot opens.
- If each active task recursively submits blocking work, all slots can be held by tasks waiting for another slot.
- Zero prevents new goroutines; negative means unlimited. Do not change the limit while group tasks are active.
- TryGo returns false without starting work when the limit is full. Choose rejection, explicit queueing, or another documented policy.
- Synchronous fallback changes latency and where work executes. Do not hide it as an innocent substitute for rejection.
- Starting a goroutine around each blocked admission defeats a goroutine bound.
- A fixed worker population, as in ForEach, separates job delivery from goroutine admission and makes canceled sends selectable.
- A cancellation-aware semaphore can suit another design, but add that dependency only for a real requirement.
- Finish task registration before final waiting can observe completion. Cancellation does not repair a broken registration protocol.

## Shared state needs synchronization, not timing

- A data race involves conflicting concurrent access without a synchronization ordering. Plain reads can race just as writes can.
- Data-race-free Go programs execute sequentially consistently. Machine-word size is not permission to race.
- Races on multiword values such as interfaces or slice descriptors can expose inconsistent internals and cause memory corruption.
- Starting a goroutine orders preceding initialization before its execution. Goroutine exit alone supplies no ordering to observers.
- Sleeping, polling an ordinary boolean, and observing an ordinary pointer do not publish other writes safely.
- Channel send orders before completion of its corresponding receive. Close orders before a receive that returns the closed-channel zero value.
- Buffered and unbuffered channels have different additional synchronization guarantees. Do not substitute one for the other as a barrier.
- WaitGroup task completion orders before the Wait return it unblocks.

### Protect an invariant with a mutex

- Choose a clear synchronization discipline for every shared object, including helper and observer methods.
- Keep related fields under the same invariant boundary. Locking separate assignments does not necessarily protect a relationship between them.
- An Unlock synchronizes before a later corresponding Lock returns. Every conflicting access must follow the discipline.
- Failed TryLock establishes no synchronization. It cannot justify an unlocked read of protected state.
- Avoid holding locks across unknown callbacks or blocking operations unless that ordering is essential and documented.
- Define a consistent order when several locks are needed. Cleanup must not reacquire a lock the same call still holds.
- RWMutex does not support upgrading, downgrading, or recursive read-locking.
- Do not copy used mutexes or other synchronization values, including through value receivers and container copies.
- Regular maps are not safe for concurrent writes even to different keys. `sync.Map` is specialized, not a universal replacement.

### Atomics protect operations, not arbitrary object graphs

- Prefer typed atomic operations when one atomic value or stable snapshot fits the invariant.
- Go atomics are sequentially consistent. Do not transplant relaxed/acquire/release recipes from another language.
- Atomic pointer publication does not make subsequent pointee mutations safe.
- For snapshot replacement, fully initialize the snapshot and keep reachable state immutable, or protect its later changes separately.
- A shallow copy of a map or slice value does not create an independent immutable snapshot.
- Several individually atomic fields do not create one indivisible multi-field update. Use a mutex or one snapshot when consistency requires that.
- `atomic.Value` requires a consistent concrete stored type and rejects nil storage. Typed atomic wrappers must not be copied after use.
- A synchronized container lookup does not synchronize later mutation of the retrieved object.

### Worked contrast: a cache entry and its eviction list

- Suppose a cache stores a map and an ordered list of the same entries.
- A concurrent-safe map alone cannot keep that list consistent with inserts and removals.
- Protect the map/list relationship with one mutex, or place both under one goroutine's ownership with a complete request protocol.
- Choose the mutex when callers need direct synchronous operations over that state.
- Choose message ownership when queueing, backpressure, or serialized service work is already part of the operation.
- Do not add a command-channel service merely to avoid a short critical section.

## Observe completion, not merely a quiet race detector

- Race detection reports exercised races, not every possible execution. A clean run is not a proof of race freedom.
- Deadlocks, lost errors, unbounded admission, and incomplete cleanup can exist without data races.
- Observe real stopping and resource release under explicit synchronization.
- Use [testing and performance](testing-and-performance.md) for integration workflows, race-instrumented execution, and performance evidence.

## Sources

| Source | Decisions supported |
| --- | --- |
| [context](https://pkg.go.dev/context), especially CancelFunc, Cause, AfterFunc, WithoutCancel, and Connection example | Signal versus join, callback completion, lifetime ownership. |
| [Contexts and structs](https://go.dev/blog/context-and-structs) | Explicit per-call lifetime rather than captured request contexts. |
| [iter](https://pkg.go.dev/iter), especially Seq, Single-Use Iterators, Mutation, and Pull | Early stop, borrowed iterator values, input lifetime, explicit pull cleanup. |
| [errgroup v0.24.0](https://pkg.go.dev/golang.org/x/sync@v0.24.0/errgroup) and [tagged implementation](https://github.com/golang/sync/blob/v0.24.0/errgroup/errgroup.go) | Joining, first error, context cancellation, blocking admission, panic behavior. |
| [sync](https://pkg.go.dev/sync), especially WaitGroup.Go, Mutex, RWMutex, and Map | Completion ordering, lock contracts, no-copy rules, specialized containers. |
| [Go memory model](https://go.dev/ref/mem), especially Goroutine creation/destruction, Channel communication, Locks, and Atomic Values | Happens-before, race-free behavior, publication, atomic ordering. |
| [Specification: select](https://go.dev/ref/spec#Select_statements), [channels](https://go.dev/ref/spec#Channel_types), and [close](https://go.dev/ref/spec#Close) | Readiness, expression evaluation, nil/closed channels, closure ownership. |
| [Pipelines and cancellation](https://go.dev/blog/pipelines), especially Stopping short and Explicit cancellation | Early consumer exit, upstream stopping, why buffers do not replace lifecycle design. |
| [sync/atomic](https://pkg.go.dev/sync/atomic) | Typed atomics, sequential consistency, Value contracts. |
| [net/http Request.Context](https://pkg.go.dev/net/http#Request.Context) | Incoming request context ends with handler completion. |
| [Data Race Detector: How To Use](https://go.dev/doc/articles/race_detector#How_To_Use) | Executed-path evidence and realistic instrumented workloads. |
