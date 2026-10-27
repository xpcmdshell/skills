# Values and iteration

## Select the operation before its syntax

| Need | Default | Choose differently when |
| --- | --- | --- |
| Transform each element | `map`, with a block-bodied callback when needed | Effects, early exit, or coordination across elements make a loop clearer. |
| Retain matching elements | `filter` | You only need the first match, so use `find`. |
| Ask whether a match exists | `some` | All elements must satisfy the condition, so use `every`. |
| Accumulate one simple value | `reduce` with an explicit initial value | Several accumulators or effects make a loop clearer. |
| Group an iterable | `Map.groupBy` or `Object.groupBy` | The target runtime lacks support or grouping needs custom accumulation. |
| Iterate values | `for...of` | You need positions too, so use `.entries()`. |
| Sequence asynchronous effects | `for...of` with `await` | Work is independent and the owner intentionally starts it concurrently. |
| Read a stream | `for await...of` | Callers need replay or indexing, so materialize within the resource lifetime. |

- Branching inside a callback does not disqualify `map`. Use it when each input produces one output independently.
- Do not use `map` only for side effects or `forEach` with an async callback expecting completion.
- `filter(Boolean)` removes all false-like values, not just missing values. Use a precise condition for the domain.
- An empty array makes `every` true. Check non-emptiness separately when the domain requires at least one element.
- `for...in` enumerates property names, including inherited enumerable properties. It is not the normal array traversal operation.
- Destructure a record where its field names clarify the operation. Avoid nested destructuring that hides which object owns a value.

## Choose records, maps, and sets

- Use a record for a known set of fields. `Record<Status, Handler>` can require a handler for every status.
- Use `Map<Key, Value>` for a dynamic collection, especially with non-string keys or explicit insertion order.
- `Map.get` can return `undefined`. Use `has` when stored `undefined` and an absent key mean different things.
- Map and set object keys use object identity, not structural equality. Two equal-looking records remain different keys.
- Map and set equality treats `NaN` as equal to itself and does not distinguish positive and negative zero.
- Plain object keys are strings or symbols. Numeric keys become strings, and integer-like keys have special enumeration order.
- Prefer `Map` for attacker-controlled dynamic keys. For object-shaped inputs, validate allowed fields and use `Object.hasOwn` for own-property checks.
- Do not spread untrusted fields into security-sensitive configuration merely because the value has a static interface.
- Serialize maps and sets deliberately. `JSON.stringify` does not encode their entries as an application schema automatically.

## Transform without accidentally changing the input

- `sort`, `reverse`, and `splice` mutate arrays. `toSorted`, `toReversed`, and `toSpliced` return new arrays.
- Copying methods, `slice`, spread, and `Map.groupBy` retain references to contained objects.
- `readonly T[]` forbids array writes through that reference. It does not make a mutable `T` deeply readonly.
- `Readonly<T>` is shallow. `as const` supplies literal and readonly typing, not runtime freezing.
- `Object.freeze` acts at runtime but remains shallow. Nested values require their own ownership or freezing policy.
- Prefer explicit domain construction when you need a stable snapshot. Use `structuredClone` only for supported values and intended cloning semantics.
- Do not use JSON serialization as a general deep-copy operation. It loses values and rejects others, such as ordinary `bigint` serialization.
- A locally owned mutable accumulator can be clearer and cheaper than repeatedly spreading an ever-growing object.
- Do not replace immutable public behavior with in-place mutation merely because an internal benchmark becomes faster.

### Example: group and sort borrowed records

- The operation groups jobs by queue and sorts each group's jobs by priority.
- The caller owns the source array. Grouping and sorting must not reorder it.
- Grouped elements remain the same job objects. This is a read-only view, not an independent snapshot.
- Requires ES2024 library definitions and runtime support for `Map.groupBy` and `toSorted`.
- Complete module, `queues.ts`:

```ts
export interface Job {
  readonly id: string;
  readonly queue: string;
  readonly priority: number;
}

export function groupJobs(jobs: Iterable<Job>): Map<string, readonly Job[]> {
  const groups = Map.groupBy(jobs, (job) => job.queue);
  const sortedGroups = new Map<string, readonly Job[]>();

  for (const [queue, entries] of groups) {
    sortedGroups.set(
      queue,
      entries.toSorted((left, right) => right.priority - left.priority),
    );
  }

  return sortedGroups;
}
```

- `Object.groupBy` fits string-keyed records when object-shaped consumption is useful. It returns a null-prototype object.
- A custom loop fits aggregation that needs totals but not retained arrays. Do not group all values merely to count them.
- Use a numeric comparator for numeric order. Default array sorting compares string representations.
- Specify a tie-breaker when equal-priority ordering has a domain requirement. Do not invent one as a style preference.

## Distinguish missing values from false-like values

- `value ?? fallback` uses the fallback only for `null` or `undefined`.
- `value || fallback` also replaces `0`, `false`, `NaN`, and `""`.
- Optional chaining stops at `null` or `undefined`. It does not validate a value's shape or catch an operation's exception.
- Default parameters and destructuring defaults apply to `undefined`, not to `null`.
- An optional field and a present field containing `undefined` can behave differently under spreading, enumeration, and membership tests.
- `JSON.stringify` omits object properties containing `undefined`; array entries with `undefined` serialize as `null`.
- Choose wire-format absence rules explicitly rather than assuming the in-memory representation survives serialization unchanged.

## Numbers, strings, and equality

- `number` includes fractions, infinities, and `NaN`. Validate finite, integer, and domain constraints separately when needed.
- Use `Number.isSafeInteger` when an integer must remain exact as a JavaScript number.
- Use `bigint` or a maintained decimal representation when exactness exceeds the number contract. Define serialization explicitly.
- Strings compare by code units, not user locale. Use `Intl.Collator` for user-facing language-sensitive sorting.
- Use `Intl` formatting for locale-aware presentation, not as a storage or interchange format.
- `===` compares object identity. Define domain equality by the actual fields or identifiers that establish equivalence.
- `Object.is` distinguishes signed zero and treats `NaN` as equal. Select it for those semantics, not because it is universally stricter.

## Deferred iteration changes contracts

- Arrays provide eager results, indexing, and repeatable traversal. Iterators can be one-shot and defer errors and effects.
- A generator's body begins on consumption, not construction. Resource acquisition inside it follows that timing.
- Keep a resource alive until dependent iteration finishes. Returning an iterator from a closed resource scope is invalid.
- Early loop exit invokes an iterator's `return` method when present. Cleanup still depends on the iterator's actual implementation.
- Async iteration overlaps no work automatically. Each awaited step follows the iterator protocol and its producer's backpressure behavior.
- Use streams for large or unbounded inputs when the format and downstream processing permit incremental work.
- Do not introduce a guessed maximum length as a substitute for streaming or a user-defined budget.

## Sources

- [MDN array methods](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) and [toSorted](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/toSorted): operation semantics and mutation.
- [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) and [Map.groupBy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/groupBy): identity, ordering, and shared grouped elements.
- [TypeScript object types](https://www.typescriptlang.org/docs/handbook/2/objects.html): readonly properties, index signatures, and aliasing.
- [MDN nullish coalescing](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing): missing-value defaults.
- [JSON.stringify](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify): serialization differences.
- [Iteration protocols](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols): lazy consumption and iterator closing.
