# State and iteration

- Read this reference when traversing or transforming data, building text, choosing collections, or changing shared state and caches.
- Trace object references before changing mutation behavior. Trace consumption before changing an iterable interface.
- A signature alone does not describe sharing, replay, evaluation time, or resource lifetime.
- When iteration owns files or other resources, read [errors and resources](errors-and-resources.md) for cleanup and borrowed-stream contracts.
- Examples target Python 3.15. Honor an existing project's declared compatibility requirements.

## Traverse values and unpack records

Sources: [looping techniques](https://docs.python.org/3/tutorial/datastructures.html#looping-techniques), [unpacking](https://docs.python.org/3/tutorial/datastructures.html#tuples-and-sequences), [`zip`](https://docs.python.org/3/library/functions.html#zip).

| Operation | Prefer | When the choice changes |
| --- | --- | --- |
| Visit each value | `for value in values` | Index arithmetic is useful when positions or neighboring elements are the actual problem. |
| Use a position and its value | `enumerate(values, start=...)` | It works with one-shot iterators, without requiring length or indexing. |
| Use dictionary keys and values | `for key, value in mapping.items()` | Iterate keys alone when values are unnecessary. |
| Consume a fixed-shape record | Unpack into meaningful names | Use named attributes when positional meaning becomes difficult to follow. |
| Pair corresponding inputs | `zip(left, right, strict=True)` when equal lengths are required | Ordinary `zip` deliberately stops at the shorter input. `zip_longest` supports an explicit padding policy. |
| Visit adjacent pairs | `itertools.pairwise(values)` | Use explicit indexing when the algorithm must edit particular sequence positions. |

- Do not replace iteration with `range(len(values))` merely to retrieve each value by index.
- Unpacking states the expected record shape. A starred target collects the remaining values into a list.
- Keep related fields in records when designing the data model. Use `zip` when inputs actually arrive separately.
- `zip` is lazy. Strict length checking occurs during consumption, not when the iterator is constructed.
- Early exit does not prove equal lengths. Completed iterations and source effects are not rolled back by a later mismatch.

### Pair separate inputs without silently dropping records

- This upstream interface supplies stop names and durations as separate iterables of equal length.
- The operation returns numbered text without a trailing newline. Empty inputs produce an empty string.
- A mismatch raises `ValueError` instead of returning a shortened report. Input iterators are consumed, not rewound.

```python
from collections.abc import Iterable


def render_stop_report(names: Iterable[str], minutes: Iterable[int]) -> str:
    stops = zip(names, minutes, strict=True)
    lines = [
        f"{position}. {name}: {duration} min"
        for position, (name, duration) in enumerate(stops, start=1)
    ]
    return "\n".join(lines)


print(render_stop_report(iter(["Dépôt", "Quay"]), iter([0, 7])))
```

- `enumerate` owns the counter. Tuple unpacking names each field without repeated positional access.
- Building the report before returning avoids publishing a partial string, but it retains the complete report in memory.
- For large streamed output, write incrementally only when the contract permits partial output on failure.

## Keep transformations readable

Sources: [list comprehensions](https://docs.python.org/3/tutorial/datastructures.html#list-comprehensions), [generator expressions](https://docs.python.org/3/reference/expressions.html#generator-expressions), [`any`](https://docs.python.org/3/library/functions.html#any), [`all`](https://docs.python.org/3/library/functions.html#all).

- Use comprehensions for direct transformations and filtering where the result expression remains easy to follow.
- Prefer `[label.strip() for label in labels]` to `list(map(lambda label: label.strip(), labels))` for a simple expression.
- Keep `map(existing_function, values)` when the named operation and lazy result make the intent clearer.
- Use a generator expression when the consumer needs one pass and the lazy timing fits the contract.
- Use a loop when steps need separate names, multiple actions, early exits, or distinct error handling.
- Do not create a throwaway list merely to perform side effects. A loop states that purpose without retaining useless results.
- Keep a clear nested comprehension when its iteration order and purpose are obvious. Nesting alone does not make it wrong.
- Split complex decisions into meaningful steps, not trivial helpers that only shorten an expression.
- Use `any(predicate(value) for value in values)` for an existence question and `all(...)` for a universal condition.
- Both short-circuit. Do not use them to run every validation or side effect when complete processing is required.
- `any` returns false for empty input; `all` returns true. A nonempty requirement needs its own check.
- Use `sum` for a numeric total and `min` or `max` for one extreme, rather than sorting the whole input.
- If emptiness is valid, choose an appropriate `default` for `min` or `max`; otherwise let it be an explicit failure.

## Choose result ordering explicitly

Sources: [sorting techniques](https://docs.python.org/3/howto/sorting.html), [dictionary ordering](https://docs.python.org/3/library/stdtypes.html#mapping-types-dict).

- Use `sorted(values, key=...)` for a new ordered list. It accepts an iterable without mutating the source collection.
- Use `values.sort(key=...)` when changing that list's order is intended. It returns `None`, not the sorted list.
- Do not assign the result of `list.sort()` or `list.append()` back to the list. These operations mutate it.
- Pass a key function for the relevant field or derived value instead of building a comparator class.
- A short `lambda`, `operator.attrgetter`, or `operator.itemgetter` can each make the key clear.
- Use tuple keys for meaningful tie-breakers. Name a key function when its calculation needs explanation or reuse.
- Sorting is stable: equal keys retain encounter order. It does not invent deterministic tie order for an unordered source.
- Dictionary insertion order is not sorted order. Iterate directly when encounter order is the contract.
- Use a set only when duplicate counts and encounter order can be discarded.

### Prioritize records without changing their identity

- Lower priority numbers come first. Equal priorities retain input order.
- Ordering belongs to this operation, not every comparison between job records.

```python
from collections.abc import Iterable
from dataclasses import dataclass


@dataclass
class Job:
    name: str
    priority: int


def prioritize(jobs: Iterable[Job]) -> list[Job]:
    return sorted(jobs, key=lambda job: job.priority)


jobs = [Job("publish", 2), Job("compile", 1), Job("test", 1)]
print([job.name for job in prioritize(jobs)])
print([job.name for job in jobs])
```

- The new list contains the original records. Sorting does not clone their state.
- Adding `order=True` to the dataclass would instead make field declaration order govern comparisons throughout the API.
- Use generated ordering only when that field ordering genuinely represents the domain, not to support one report.

## Build text for its consumer

Sources: [formatted string literals](https://docs.python.org/3/tutorial/inputoutput.html#formatted-string-literals), [`str.join`](https://docs.python.org/3/library/stdtypes.html#str.join), [text streams](https://docs.python.org/3/library/io.html#text-i-o).

| Need | Starting choice | Reason or limit |
| --- | --- | --- |
| Mix values with literal text | An f-string | Formatting rules stay beside the value, such as `f"{amount:.2f}"`. |
| Combine existing strings with a separator | `separator.join(parts)` | It expresses assembly directly without manual separator or trailing-delimiter logic. |
| Combine a few fixed strings | `left + right` or an f-string | Simple concatenation does not need a builder abstraction. |
| Supply an in-memory text stream | `io.StringIO` | Use it when a writer interface or incremental construction fits the operation. |
| Send large output to a stream | Write to the destination | Avoid retaining the whole result when partial output and stream ownership are defined. |

- Repeated string growth in a loop can repeatedly copy accumulated text. Prefer joining pieces or a suitable stream.
- `join` requires strings. Convert values explicitly when text conversion is intended; do not silently stringify invalid records.
- A generator supplied to `join` still produces a fully materialized result string.
- Build paths with `pathlib`, structured formats with their serializers, and database queries with parameters, not string interpolation.
- Text formatting does not supply escaping or protocol validation. Read [errors and resources](errors-and-resources.md) for those boundaries.

## Identity, aliases, and copies

Sources: [objects, values, and types](https://docs.python.org/3.14/reference/datamodel.html#objects-values-and-types), [copy operations](https://docs.python.org/3.14/library/copy.html), [sequence operations](https://docs.python.org/3.14/library/stdtypes.html#common-sequence-operations).

- A name refers to an object. Assignment binds another name; it does not copy the object.
- Mutation changes an object visible through its aliases. Rebinding one local name does not rebind other names.
- Use `==` for value equality. Use `is` for `None`, sentinels, and deliberate identity relationships.
- Do not use identity to compare numbers or strings. Reuse of immutable objects is not a portable value contract.
- A shallow copy creates a new outer container. Its elements still refer to the original objects.
- Copy the mutable levels that need independent ownership. Keep intentional sharing explicit.
- Do not apply `deepcopy()` as a universal repair. It can copy too much and invoke custom copying behavior.
- Locks, streams, clients, and other resources need ownership rules, not an assumed deep-copy operation.

```python
original: dict[str, list[str]] = {"build": ["queued"]}
alias = original
shallow = original.copy()
independent = {name: states.copy() for name, states in original.items()}

original["build"].append("running")

assert alias is original
assert shallow is not original
assert shallow["build"] is original["build"]
assert independent["build"] == ["queued"]
```

- Here, copying each list provides independence because its elements are strings.
- A list containing mutable records needs a separate decision about sharing those records.
- Sequence repetition repeats references: `[[]] * count` does not create independent inner lists.
- Build independent inner lists with a comprehension when each element needs separate mutable state.
- `dict.fromkeys(keys, mutable_value)` also shares one value across all keys. Use a comprehension for independent values.

## Create defaults at the right lifetime

Sources: [default argument values](https://docs.python.org/3.14/tutorial/controlflow.html#default-argument-values), [dataclass default factories](https://docs.python.org/3.14/library/dataclasses.html#default-factory-functions).

| Intended lifetime | Mechanism | Contract |
| --- | --- | --- |
| Independent state per call | Create the object inside the function | Calls do not inherit previous mutations. |
| Independent state per instance | `field(default_factory=list)` or another factory | Each instance receives a fresh value. |
| Shared state across calls | Explicit owner, cache, or deliberately shared object | State lifetime, invalidation, and synchronization remain visible. |
| Immutable default value | Ordinary default argument | Sharing is safe when the value and its contents cannot change. |

- Default argument expressions run when Python defines the function, not on each call.
- A factory must create independent state. A factory that returns one global list still shares that list.
- Mutable class attributes are shared across instances unless an instance attribute replaces them.
- An optional container parameter needs a documented mutation policy. Choosing a fresh default does not remove aliasing for supplied values.

```python
from dataclasses import dataclass, field


@dataclass
class Draft:
    labels: list[str] = field(default_factory=list)


def append_label(label: str, labels: list[str] | None = None) -> list[str]:
    """Append to the supplied list, or create a fresh list when omitted."""
    if labels is None:
        labels = []
    labels.append(label)
    return labels


first = Draft()
second = Draft()
first.labels.append("review")
assert second.labels == []
assert append_label("new") == ["new"]
assert append_label("next") == ["next"]
```

- If callers retain ownership and mutation is unwanted, construct a new list from their input instead.
- Do not replace `if labels is None` with `if not labels`; an empty supplied list is still a supplied object.

## Distinguish absence from false-like values

Sources: [truth value testing](https://docs.python.org/3.14/library/stdtypes.html#truth-value-testing), [dictionary operations](https://docs.python.org/3.14/library/stdtypes.html#mapping-types-dict).

- `None`, `False`, zero, and empty containers all test false. They can have different domain meanings.
- Use `value is None` when only `None` selects a default.
- Use membership or a unique sentinel when missing and explicitly `None` have different meanings.
- `mapping.get(key, fallback)` uses the fallback only for a missing key. It preserves an existing `None` or zero.
- `mapping.get(key) or fallback` replaces all false-like results. Use it only when that is the intended contract.
- A private `object()` sentinel supports identity checks when `None` is a valid argument value.
- Give sentinel-based public interfaces useful annotations. Do not widen the whole interface to `Any` to avoid narrowing.

```python
from collections.abc import Mapping


def retry_setting(settings: Mapping[str, int | None], *, fallback: int) -> int | None:
    """Preserve explicit zero and None; use fallback only when absent."""
    return settings.get("retries", fallback)


assert retry_setting({}, fallback=2) == 2
assert retry_setting({"retries": 0}, fallback=2) == 0
assert retry_setting({"retries": None}, fallback=2) is None
```

## Separate read-only access from immutable data

Sources: [dataclass freezing](https://docs.python.org/3.14/library/dataclasses.html#frozen-instances), [mapping proxies](https://docs.python.org/3.14/library/types.html#types.MappingProxyType), [typing recommendations](https://typing.python.org/en/latest/reference/best_practices.html#arguments-and-return-types).

| Mechanism | What it provides | What it does not provide |
| --- | --- | --- |
| `Mapping[K, V]`, `Sequence[T]` | An interface without mutation methods | Runtime enforcement, a snapshot, or immutable contents |
| `tuple` | Fixed element references | Immutability of referenced objects |
| `@dataclass(frozen=True)` | Generated restrictions on field assignment | Recursive freezing of field values |
| `MappingProxyType(mapping)` | Runtime read-only access to that mapping | A snapshot; changes through other aliases remain visible |
| A copied container | Independence at copied levels | Independence of nested objects that remain shared |

- Use read-only interfaces when sharing is acceptable; they avoid a copy without preventing writes through other aliases.
- For a stable snapshot, define which contents must remain unchanged and build those from immutable components.
- A frozen dataclass containing a list or a copied dictionary containing mutable values is not a deeply immutable snapshot.
- For record representation and boundary annotations, read [types and validation](types-and-validation.md).

## Keep equality and hashing consistent

Sources: [equality and hashing](https://docs.python.org/3.14/reference/datamodel.html#object.__hash__), [dataclass generated methods](https://docs.python.org/3.14/library/dataclasses.html#dataclasses.dataclass).

- Equal objects must have equal hashes. Equal hashes do not establish equality.
- A hash must remain stable while its object is a dictionary key or set member.
- Keep equality-participating state stable for value-based keys. Otherwise, lookups can fail after mutation.
- Defining `__eq__` without `__hash__` normally makes instances unhashable. This prevents an incompatible identity hash.
- If custom equality cannot compare an operand type, return `NotImplemented` rather than inventing a result for it.
- Identity-based objects can be mutable and hashable. Mutability alone does not determine whether hashing is valid.
- Do not add `unsafe_hash=True` merely to make a mutable dataclass fit into a set.
- Frozen dataclasses generate a hash under the usual `eq=True` contract, but their field values must still support hashing.
- A tuple containing a list remains unhashable even though its outer structure cannot change.
- Equal numeric keys such as `1`, `1.0`, and `True` can refer to one dictionary entry.
- Validate domain distinctions before using such values as keys when their types must remain distinct.
- Do not persist built-in `hash()` values as identifiers. String and bytes hashes vary across interpreter runs.

```python
from dataclasses import dataclass


@dataclass(frozen=True)
class ArtifactKey:
    project: str
    revision: str


locations: dict[ArtifactKey, str] = {
    ArtifactKey("website", "release"): "artifacts/site.zip"
}
assert locations[ArtifactKey("website", "release")] == "artifacts/site.zip"
```

- This record has value equality and immutable string fields. Independently constructed equal keys retrieve the same entry.
- For mutable entity identity, a stable explicit identifier can be a better key than the whole object.

## Choose a collection from its operations

Sources: [built-in collections](https://docs.python.org/3.14/library/stdtypes.html), [specialized collections](https://docs.python.org/3.14/library/collections.html).

| Need | Start with | Important behavior |
| --- | --- | --- |
| Ordered mutable items, indexing, appending | `list[T]` | Membership scans items; removing from the front shifts elements. |
| Fixed positional values or immutable sequence structure | `tuple[...]` | Referenced values can still be mutable. |
| Key lookup and associated values | `dict[K, V]` | Preserves insertion order, not sorted order. Keys need valid hashing. |
| Unique members and set operations | `set[T]` | No ordering contract. Members need valid hashing. |
| Immutable set structure | `frozenset[T]` | Suitable as a key when its elements are hashable. |
| Counts by key | `Counter[T]` | Missing counts read as zero; stored zero and negative counts need deliberate handling. |
| Grouping into newly created buckets | `defaultdict[K, V]` | Missing indexed reads can create entries; `.get()` does not invoke the factory. |
| Appending and removing at either end | `deque[T]` | Efficient end operations; middle indexing is not its strength. |

- Use a set for membership when duplicates and order do not matter. Do not silently discard either when callers depend on them.
- Use `dict.get()` for a fallback that must not mutate the dictionary.
- Use `defaultdict` when creation on a missing indexed read matches the operation.
- A `deque(maxlen=...)` evicts items when full. It is not lossless backpressure.
- A collection's capacity policy follows real requirements. Do not drop valid input to satisfy an unexplained cutoff.
- Prefer existing collection behavior over a custom framework that merely renames indexing, grouping, or iteration.

### Group values without a collection wrapper

- A stream contains category and label pairs. Preserve category encounter order and label order within each category.
- `defaultdict(list)` creates a separate bucket for each new category, without repeated membership tests and initialization branches.

```python
from collections import defaultdict
from collections.abc import Iterable


def group_labels(entries: Iterable[tuple[str, str]]) -> dict[str, list[str]]:
    groups: defaultdict[str, list[str]] = defaultdict(list)
    for category, label in entries:
        groups[category].append(label)
    return dict(groups)


print(group_labels(iter([("rail", "A"), ("bus", "B"), ("rail", "C")])))
```

- Returning an ordinary dictionary fits callers that need lookup, not automatic bucket creation.
- Return the specialized collection when its additional behavior is part of the intended public contract.
- For counts alone, `Counter(keys)` already performs accumulation. Do not maintain lists only to measure their lengths.
- `dict.setdefault` can suit occasional initialization, but its default expression runs even when the key already exists.
- Use a factory or an explicit missing-key branch when constructing an unused default would be costly or have effects.

## Make consumption and replay explicit

Sources: [iterator types](https://docs.python.org/3.14/library/stdtypes.html#iterator-types), [`itertools.tee`](https://docs.python.org/3.14/library/itertools.html#itertools.tee).

- An iterable can produce an iterator. An iterator holds traversal state and is usually consumed once.
- An iterator's `iter()` returns itself. An exhausted iterator must remain exhausted.
- Generators, open files, and many adapters such as `map()` are one-shot iterators.
- `Iterable[T]` does not promise replay, indexing, a known length, or a cheap pass.
- Do not make a diagnostic pass over an unknown iterable and then assume the processing pass sees the same items.
- Consume once when one pass meets the contract. Choose stronger input requirements when the operation needs them.

| Requirement | Suitable approach | Cost or qualification |
| --- | --- | --- |
| Transform each item once | Iterate directly | Work and failures can occur during consumption. |
| Replay or index a bounded result | Materialize deliberately | Retains items in memory; the copy still shares item objects. |
| Recompute each pass | Accept a factory returning a fresh iterator | Repeats I/O or effects unless the factory contract prevents them. |
| Split a traversal with `tee()` | Use only with understood consumer behavior | Lagging consumers cause buffering; the resulting iterators are not thread-safe. |

- Do not materialize unbounded input. For large bounded input, weigh retained memory against replay and indexing needs.
- `Collection[T]` adds size and membership operations. It does not add positional indexing.
- A stronger annotation does not freeze the underlying collection against changes through other aliases.
- Changing a returned list into a generator changes replay, error timing, and lifetime. It is not a cosmetic refactor.

## Put lazy evaluation inside the contract

Sources: [generator expressions](https://docs.python.org/3.14/reference/expressions.html#generator-expressions), [yield expressions](https://docs.python.org/3.14/reference/expressions.html#yield-expressions), [StopIteration](https://docs.python.org/3.14/library/exceptions.html#StopIteration).

- Calling a generator function creates a generator. Its body starts when the consumer advances it.
- A generator expression evaluates its leftmost iterable expression immediately, but defers element production and much other work.
- Parsing, callbacks, I/O, and their exceptions can therefore occur after construction.
- Place relevant exception handling around consumption, not only around iterator creation.
- A suspended generator retains its local state and references. Streaming avoids full materialization, not all memory retention.
- Complete a generator with `return` or normal fallthrough. Raising `StopIteration` inside it becomes `RuntimeError`.

```python
from collections.abc import Iterable, Iterator


def parse_counts(lines: Iterable[str]) -> Iterator[int]:
    """Consume lines once; integer-conversion errors occur during iteration."""
    for line in lines:
        yield int(line)


counts = parse_counts(("2", "5"))
assert sum(counts) == 7
assert list(counts) == []
```

- Replacing a line with nonnumeric text raises `ValueError` when consumption reaches that line, not when `parse_counts()` returns.
- Resource-dependent lazy work must remain within the resource owner's lifetime.
- A generator expression over a file does not keep that file usable after its `with` scope exits.
- `break` does not establish deterministic closure of an arbitrary iterator.
- For context managers, early generator closure, and borrowed versus owned streams, read [errors and resources](errors-and-resources.md).

## Treat caches as shared state with a lifetime

Source: [`cache` and `lru_cache`](https://docs.python.org/3.14/library/functools.html#functools.lru_cache).

- Cache deterministic computations when reuse justifies retained memory and lookup overhead.
- Include all result-affecting inputs in the key, or define invalidation for external state that changes.
- Cached arguments and results remain referenced until eviction or clearing. A cached instance method can retain `self`.
- Cached mutable results are shared objects. A caller's mutation can change what later callers receive.
- Prefer immutable cached values, or return independent copies under an explicit cost and mutation contract.
- Do not cache generator objects or coroutine objects. Reusing them does not recreate their consumed or awaited computation.
- Choose a bounded `lru_cache` capacity from the working set and memory budget. An entry bound is not a byte bound.
- Use an unbounded cache only when key growth and the owner's lifetime make retention acceptable.
- Specify when configuration changes, source updates, or user changes invalidate entries. A size bound does not prevent stale values.
- The cache's internal thread safety does not guarantee one computation per key. Concurrent misses can compute the result more than once.
- Do not rely on a cache to make a side effect occur exactly once.
- For synchronization and concurrent ownership, read [concurrency](concurrency.md). For measurement before optimization, read [verification and performance](verification-and-performance.md).
