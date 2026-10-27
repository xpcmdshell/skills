# Values, types, and iteration

- Read this reference when changing representation, mutation, copying, collections, nil handling, equality, text, or iteration.
- Use current Go 1.27 semantics and standard collection helpers.
- Trace which values are copied and which underlying objects remain shared before changing a boundary.
- Read [packages and APIs](packages-and-apis.md) when choosing constructors, receivers, interfaces, or public compatibility.
- Read [errors and I/O](errors-and-io.md) when iteration or parsing uses a stream or owns resources.
- Read [concurrency and context](concurrency-and-context.md) when aliases cross goroutines or require synchronization.

## Assignment copies values, not necessarily their reachable data

- Go passes arguments and assigns results by value.
- A copied value can still contain references to shared mutable storage.
- Replacing one variable's value does not replace another variable's value.
- Mutating shared storage can nevertheless be visible through both values.

| Value | What assignment copies | What can remain shared |
| --- | --- | --- |
| Scalar or string | Its value | Strings are immutable; storage sharing does not permit byte mutation. |
| Array | Its elements | References held inside elements can still lead to shared objects. |
| Struct | Its fields | Slice, map, pointer, and other reference-containing fields can still share state. |
| Pointer | The pointer value | The pointed-to variable. |
| Slice | Length, capacity, and a reference to an array | Elements of the backing array. |
| Map | A reference to map state | Entries and any referenced objects in keys or values. |
| Channel | A reference to channel state | The channel and referenced values passed through it. |
| Function | The function value and captured environment references | Variables captured by a closure. |
| Interface | A value with its dynamic type | Sharing follows the stored concrete value's representation. |

- A value receiver does not make its reachable data immutable.
- A pointer does not grant exclusive access or establish a resource owner.
- There is no general language-level read-only slice or ownership annotation.
- A shallow copy separates the outer container only; copy each mutable level that actually needs independence.
- Avoid universal deep-copy machinery for resources, identity-bearing objects, or deliberately shared state.
- Types containing synchronization objects or other non-copyable state need their documented copying restrictions preserved.
- Assignment is permitted by the language even when a library type's contract forbids copying after use.

Sources: [specification: representation of values](https://go.dev/ref/spec#Representation_of_values),
[calls](https://go.dev/ref/spec#Calls),
[Google: copying](https://google.github.io/styleguide/go/decisions#copying).

## Type identity and constraints

- A defined type is distinct from the type used to define it.
- A type alias names the same type; it does not establish a new semantic distinction.
- A defined type does not inherit methods declared on the original defined type.
- Embedding is different: it can promote methods from a stored field.
- Underlying types explain permitted conversions and generic underlying-type constraints; they do not erase all type distinctions.
- Converting a named slice to another compatible slice type does not clone its backing storage.
- Explicit numeric conversions can truncate or otherwise change values; distinct types do not validate domain rules automatically.

Context: these are type declarations, not a complete program.

```go fragment
type AccountID string            // Distinct from string.
type LegacyAccountID = AccountID // The same type as AccountID.

type Set[E comparable] = map[E]struct{} // A generic alias, not a wrapper type.
```

- The set alias keeps the map's nil, mutation, and equality behavior. It does not enforce a richer set invariant.
- A generic type must be instantiated before use.
- A method-only, basic interface can be a value type as well as a generic constraint.
- A non-basic interface containing type terms, unions, or `comparable` is usable only as a constraint.
- A constraint limits admissible type arguments and the operations available inside generic code.
- `T` as a type term selects that exact type; `~T` includes types whose underlying type is `T`.
- Union terms add alternatives; separate embedded requirements intersect the permitted type sets.
- Use `~[]E` when a collection operation should accept defined slice types and preserve their type in its result.
- `slices.Clone` already provides that behavior; an element-only helper returning `[]E` loses the caller's defined slice type.
- Keep generic-interface constraints broad enough for valid implementations; add comparability only where equality or map keys require it.
- A type parameter's zero value follows its argument type. A pointer argument produces a nil pointer, not an initialized implementation.
- Passing a ready value can be simpler than extra constraints that construct a value and recover its pointer method set.

Sources: [specification: type identity](https://go.dev/ref/spec#Type_identity),
[type declarations](https://go.dev/ref/spec#Type_declarations),
[general interfaces](https://go.dev/ref/spec#General_interfaces),
[deconstructing type parameters](https://go.dev/blog/deconstructing-type-parameters),
[generic interfaces](https://go.dev/blog/generic-interfaces).

## Nil and interface values

- Nil is the zero value for pointers, slices, maps, channels, functions, and interfaces, with different allowed operations.
- Do not infer that all nil values have the same behavior.

| Nil value | Useful operations | Operation requiring care |
| --- | --- | --- |
| Slice | Length, capacity, range, append, and valid empty slicing | Indexing an element is out of range. |
| Map | Lookup, length, range, deletion, and clearing | Insertion panics until the map is initialized. |
| Pointer | Comparison, assignment, and intentionally nil-aware methods | Dereferencing nil panics. |
| Function | Comparison with nil and assignment | Calling nil panics. |
| Channel | Comparison and use as a disabled select case | Sending and receiving block; closing nil panics. |
| Interface | Comparison and assignment | Invoking a method on a nil interface panics. |

- A nil interface has no dynamic concrete type or value.
- Storing a typed nil pointer in an interface gives it a dynamic type; the interface is then non-nil.
- This also applies to typed nil slices, maps, functions, and channels stored in interfaces.
- Interface nil checks do not validate initialization of the dynamic implementation.
- Return an explicit nil interface for absence or successful error results instead of accidentally converting a nil concrete pointer.
- For error contracts and current error-inspection APIs, read [errors and I/O](errors-and-io.md).
- Reflective `IsNil` is not a universal replacement: it panics for unsuitable kinds and invalid reflection values.

### A typed nil can still have intentional method behavior

- This implementation explicitly handles a nil pointer receiver.
- The non-nil interface and nil pointer are different facts; neither proves that a dereference would be safe.

```go
package main

import "fmt"

type Label struct {
	Text string
}

func (l *Label) String() string {
	if l == nil {
		return "<missing>"
	}
	return l.Text
}

func main() {
	var label *Label
	var display fmt.Stringer = label
	var absent fmt.Stringer
	fmt.Println(label == nil, display == nil, absent == nil)
	fmt.Println(display.String())
}
```

Expected output:

```text
true false true
<missing>
```

- Do not generalize nil support to another method or implementation unless its contract provides it.
- Calling a value-receiver method through a nil pointer can require a dereference before the method body runs.
- Treat the dynamic-type/value pair as a semantic model, not a stable ABI for unsafe representation tricks.

Sources: [specification: variables](https://go.dev/ref/spec#Variables),
[selectors](https://go.dev/ref/spec#Selectors),
[FAQ: nil errors](https://go.dev/doc/faq#nil_error),
[reflect.Value.IsNil](https://pkg.go.dev/reflect#Value.IsNil).

## Slices are views of backing arrays

- A slice's length bounds indexing; its capacity controls how far it can be extended through slicing.
- A copied slice descriptor keeps its own length and capacity but still refers to the same array.
- Reslicing a local parameter does not change the caller's descriptor.
- Element writes affect aliases that refer to those same elements.
- `append` returns the resulting slice. Keep that result when the caller needs the new length or array association.
- Append reuses the array when capacity is sufficient; otherwise it allocates a sufficiently large array.
- No fixed capacity-growth ratio is a language guarantee.
- A function can accept a slice without a pointer when it only mutates elements.
- Return the updated slice or intentionally replace it through a pointer when its descriptor must change.

### Build slices from the result shape

| Result requirement | Starting point | Why it fits |
| --- | --- | --- |
| Select elements or accumulate an unknown count | `var result []T`, then `result = append(result, value)` | Length follows the elements actually produced. |
| Produce one value at each known position | `result := make([]T, n)`, then `result[i] = value` | All result positions exist and retain their input correspondence. |
| Append with a useful size estimate | `result := make([]T, 0, n)`, then append | Capacity reserves space; length remains zero until elements are added. |
| Produce a fixed small collection | A slice literal | The actual elements express the result directly. |

- A nil slice is a useful empty accumulator; do not allocate only to make append possible.
- `make([]T, n)` already contains `n` zero-valued elements. Appending adds after them, rather than filling them.
- Capacity does not make indexes writable beyond length. Use indexed assignment only for positions that exist.
- Reserve space when a known count or useful estimate makes it worthwhile; do not reserve a large worst case automatically.
- An upper bound such as the input length can waste memory when filtering keeps few values. Unknown-count append remains valid.
- Preallocation can reduce growth work, but does not prove an end-to-end performance gain. Measure material performance changes.
- Construction can change nil-versus-empty results. Preserve an established absence or serialization contract instead of enforcing one form everywhere.
- Fresh outer storage does not deep-copy referenced elements; apply the [view and copy guidance](#choose-view-transfer-or-copy-deliberately) when independence matters.

### Selection and one-to-one mapping need different construction

- This fragment assumes `names []string`. Filtering appends only selected values; mapping fills every input position.
- Both results preserve order and leave the input unchanged.

```go fragment
var selected []string
for _, name := range names {
	if name != "" {
		selected = append(selected, name)
	}
}

lengths := make([]int, len(names))
for i, name := range names {
	lengths[i] = len(name)
}
```

- For `[]string{"fern", "", "oak"}`, selected names are `["fern", "oak"]` and byte lengths are `[4, 0, 3]`.
- If no names qualify, `selected` remains nil. Reserving with `make([]string, 0, n)` instead produces a non-nil empty result.
- Starting the filter with `make([]string, len(names))` would add unwanted empty elements before the appended names.

Sources: [specification: making slices](https://go.dev/ref/spec#Making_slices_maps_and_channels),
[append](https://go.dev/ref/spec#Appending_and_copying_slices),
[Code Review Comments: empty slices](https://go.dev/wiki/CodeReviewComments#declaring-empty-slices),
[mechanics of append: make](https://go.dev/blog/slices#make).
The empty-slice style default does not override current JSON options or an existing nilness contract.

### Capacity changes the observable alias behavior

- The array fixes the initial capacity, so this example does not depend on an allocator's growth policy.
- A full slice expression limits append capacity; it does not stop writes to existing elements.

```go
package main

import "fmt"

func main() {
	backing := [3]int{1, 2, 3}
	copied := backing
	copied[0] = 8
	fmt.Println(backing, copied)

	view := backing[:2]
	grown := append(view, 9)
	fmt.Println(backing, len(view), grown)

	limited := view[:len(view):len(view)]
	detached := append(limited, 7)
	detached[0] = 8
	limited[1] = 6
	fmt.Println(backing, detached)
}
```

Expected output:

```text
[1 2 3] [8 2 3]
[1 2 9] 2 [1 2 9]
[1 6 9] [8 2 7]
```

- `grown` shares the original array and overwrites its third element without changing `view`'s length.
- Appending to `limited` requires another array, but `limited` itself remains an alias of existing elements.
- A different initial capacity can therefore change the effects of an apparently local append.

Sources: [specification: slice types](https://go.dev/ref/spec#Slice_types),
[slice expressions](https://go.dev/ref/spec#Slice_expressions),
[append and copy](https://go.dev/ref/spec#Appending_and_copying_slices),
[mechanics of append](https://go.dev/blog/slices).

### Choose view, transfer, or copy deliberately

| Requirement | Mechanism | Limit |
| --- | --- | --- |
| Share a bounded window | Ordinary slice | Caller and callee can modify shared elements. |
| Prevent append through a view from using adjacent capacity | Full slice expression or `slices.Clip` | Existing elements and backing-array retention remain shared. |
| Copy elements into new outer storage | `slices.Clone`, or appropriately sized storage plus `copy` | Nested pointers, slices, and maps remain shared. |
| Replace elements in caller storage | Mutate the supplied slice | State bounds, overlap, and mutation behavior in the API. |
| Transfer an existing buffer | A documented ownership contract | The language does not enforce the caller's promise to stop using it. |

- `slices.Clip` returns `s[:len(s):len(s)]`; it does not clone or release the backing array.
- `slices.Clone` is shallow and preserves nilness. It does not promise an exact capacity.
- `copy` writes at most the smaller length; spare destination capacity alone does not make elements writable by `copy`.
- `copy` and `append` define overlapping-input behavior; ordinary overlap does not require custom reverse-copy machinery.
- `bytes.Buffer.Bytes` returns an alias valid only until the next buffer modification.
- `bytes.NewBuffer` takes ownership of its supplied buffer; it is not a defensive-copy constructor.
- Copy at a boundary when independent ownership is required, not merely because a function call crosses a package.
- Document mutation, retention, and view validity whenever callers cannot infer them safely.

Sources: [slices.Clone](https://pkg.go.dev/slices#Clone), [slices.Clip](https://pkg.go.dev/slices#Clip),
[bytes.Buffer.Bytes](https://pkg.go.dev/bytes#Buffer.Bytes),
[bytes.NewBuffer](https://pkg.go.dev/bytes#NewBuffer),
[Uber: boundary copies](https://github.com/uber-go/guide/blob/master/style.md#copy-slices-and-maps-at-boundaries).
The boundary-copy recommendation is useful for independence, not a prohibition on documented borrowing or transfer.

### Retention and in-place helpers

- A small slice can keep a large backing array reachable. Copy the needed region when independent retention matters.
- Shortening a slice does not itself erase references stored outside its new length.
- Current `slices.Delete`, `DeleteFunc`, `Compact`, `CompactFunc`, and shrinking `Replace` zero obsolete tail elements.
- These operations mutate the backing array and return an updated descriptor. Do not keep using the original as an unchanged value.
- Capture returned descriptors for resizing helpers such as `Delete`, `Compact`, `Insert`, `Replace`, and `Grow`.
- `slices.Sort` changes element order without changing length, so it does not return another descriptor.
- A custom in-place algorithm must handle obsolete references when retention matters.
- `clear(slice)` zeroes elements up to its current length; it does not shorten the slice.
- Zeroing shared elements is itself observable mutation; ensure that it fits the ownership contract.
- Reachability explains possible retention, not a promise about when garbage collection runs or memory returns to the OS.

Sources: [robust generic slice functions](https://go.dev/blog/generic-slice-functions),
[slices documentation](https://pkg.go.dev/slices), [specification: clear](https://go.dev/ref/spec#Clear).

## Maps share state and have no iteration-order contract

- Map assignment does not copy entries. Reassigning one map variable does not replace another alias's map.
- Lookup returns the element type's zero value for an absent key or nil map.
- Use `(value, ok)` when a stored zero and absence mean different things.
- Initialize a map before insertion; nil supports reads, length, range, deletion, and clearing.
- The `make` size argument is a hint, not a maximum or a map capacity exposed by `cap`.
- A map element is not addressable. Update a struct value through read-modify-write, or deliberately store pointers.
- Pointer-valued entries add identity, aliasing, and possible nil values; they are not automatically better than values.
- Iteration order is unspecified and may change between iterations.
- Deleting an unseen entry during iteration prevents its production.
- An entry created during iteration may or may not be produced.
- Use `clear` to remove all entries when that is the intended operation.
- A clone is not automatically a synchronized snapshot of a concurrently changing map.
- For concurrent map access, read [concurrency and context](concurrency-and-context.md) before choosing ownership or synchronization.

### Clone the mutable levels that need independence

- `maps.Clone` separates entries, but values copied by assignment can still refer to mutable objects.
- Here, string elements need no further mutable copy after their containing slices are cloned.

```go
package main

import (
	"fmt"
	"maps"
	"slices"
)

func main() {
	original := map[string][]string{"route": {"queued"}}
	shallow := maps.Clone(original)
	shallow["route"][0] = "ready"
	shallow["local"] = []string{"only-copy"}
	fmt.Println(original["route"][0], len(original), len(shallow))

	independent := make(map[string][]string, len(original))
	for name, states := range original {
		independent[name] = slices.Clone(states)
	}
	independent["route"][0] = "sent"
	fmt.Println(original["route"][0], independent["route"][0])
}
```

Expected output:

```text
ready 1 2
ready sent
```

- A slice of pointers to mutable records would need another decision about record sharing.
- Do not describe this as a general deep-copy recipe for arbitrary types or resources.

Sources: [specification: map types](https://go.dev/ref/spec#Map_types),
[index expressions](https://go.dev/ref/spec#Index_expressions),
[range](https://go.dev/ref/spec#For_range), [maps.Clone](https://pkg.go.dev/maps#Clone).

## Equality must match the domain relation

| Need | Mechanism | What it does not imply |
| --- | --- | --- |
| Built-in equality of comparable values | `==` | Domain equality, immutability, or a useful total order. |
| Pointer identity | Pointer `==` | Equality of pointed-to contents. Distinct zero-size variables need not have distinct pointer identities. |
| Slice element equality | `slices.Equal` | Deep equality; it uses element `==` and considers nil and empty slices equal. |
| Domain-specific slice equality | `slices.EqualFunc` | The callback must supply the intended relation. |
| Map pair equality | `maps.Equal` | Deep value equality or special handling of non-reflexive keys. |
| Custom map value equality | `maps.EqualFunc` | Keys still use Go's built-in key equality. |
| Recursive structural comparison | `reflect.DeepEqual` | Domain semantics; it inspects unexported fields, distinguishes nil/empty, and has identity shortcuts. |
| Equality of time instants | `time.Time.Equal` | Equality of the entire stored location and representation. |

- Structs are comparable when all field types are comparable; arrays are comparable when their element type is comparable.
- Slices, maps, and functions can only be compared with nil, not with each other using `==`.
- An interface comparison can panic when both dynamic types are identical and that type is uncomparable.
- The same hazard can occur inside comparable structs or arrays containing interface fields or elements.
- A constraint of `comparable` permits interface type arguments such as `any`; unsuitable dynamic values can still panic.
- A map with interface keys has the corresponding dynamic-key hazard.
- Float NaN is not equal to itself. NaN keys do not become ordinary retrievable keys through generic map helpers.
- A method named `Equal` does not override `==` or map-key equality.
- Use an explicit operation or canonical key when built-in equality does not match the domain.

### Collection equality and instant equality answer different questions

```go
package main

import (
	"fmt"
	"reflect"
	"slices"
	"time"
)

func main() {
	var absent []int
	empty := []int{}
	fmt.Println(slices.Equal(absent, empty), reflect.DeepEqual(absent, empty))

	utc := time.Date(2026, time.October, 1, 12, 0, 0, 0, time.UTC)
	east := utc.In(time.FixedZone("east", 3600))
	fmt.Println(utc == east, utc.Equal(east))
}
```

Expected output:

```text
true false
false true
```

- Prefer length checks when the requirement is only emptiness.
- Preserve explicit nilness contracts when serialization, reflection, or an established API distinguishes absence from an empty value.
- JSON representation depends on the chosen API and options; do not assume all JSON APIs encode nil collections identically.
- Public comparability is a compatibility property. Adding a non-comparable field can break existing equality and map-key uses.
- Adding even a comparable field can change the meaning of equality for instances with different new-field values.

Sources: [specification: comparisons](https://go.dev/ref/spec#Comparison_operators),
[constraint satisfaction](https://go.dev/ref/spec#Satisfying_a_type_constraint),
[all your comparable types](https://go.dev/blog/comparable),
[slices.Equal](https://pkg.go.dev/slices#Equal), [maps](https://pkg.go.dev/maps),
[reflect.DeepEqual](https://pkg.go.dev/reflect#DeepEqual), [time.Time.Equal](https://pkg.go.dev/time#Time.Equal),
[JSON v2 migration semantics](https://pkg.go.dev/encoding/json#hdr-Migrating_to_v2).

Context: this intentionally panicking expression assumes a declared generic `Equal[T comparable](a, b T) bool` that evaluates `a == b`.

```go fragment
Equal[any]([]int{1}, []int{1}) // Compiles, but identical uncomparable dynamic types make equality panic.
```

- Prefer a concrete comparable key or a supplied domain comparison when arbitrary dynamic values are not needed.
- Do not hide a domain mismatch behind reflection merely to avoid a type restriction.

## Strings hold bytes; text operations choose an interpretation

- A string is an immutable sequence of bytes and need not contain valid UTF-8.
- `len` counts bytes. Indexing returns a byte, and byte slicing can split an encoded code point.
- Ranging over a string decodes UTF-8 and yields byte offsets plus rune values.
- An invalid encoding yields the replacement rune and advances one byte.
- `rune` is an alias for `int32`, not a validated Unicode scalar or a user-perceived character.
- A grapheme can contain multiple code points. Rune count is not a general display-character count.
- Go does not normalize strings automatically; visually similar text can have different bytes and equality.
- Choose bytes for byte protocols, runes for code-point operations, and a suitable text algorithm for normalization or graphemes.
- Validate UTF-8 explicitly when validity is an input requirement.
- Conversion to `[]rune` decodes text and changes malformed-input handling; it is not a free indexing view.
- String/byte conversions preserve observable string immutability; exact allocation is not the language contract.
- Integer-to-string conversion encodes a code point, not decimal digits. Use `strconv` or formatting for decimal rendering.

### Code points, bytes, and visual similarity differ

```go
package main

import (
	"fmt"
	"unicode/utf8"
)

func main() {
	combining := "e\u0301"
	composed := "\u00e9"
	fmt.Println(len(combining), utf8.RuneCountInString(combining), combining == composed)

	malformed := "A\xffB"
	fmt.Println(utf8.ValidString(malformed))
	for offset, value := range malformed {
		fmt.Printf("%d %U\n", offset, value)
	}
}
```

Expected output:

```text
3 2 false
false
0 U+0041
1 U+FFFD
2 U+0042
```

- The strings containing the accented letter can look alike without comparing equal.
- A valid encoded replacement character and an invalid byte can both yield the replacement rune during range.
- Decode with width information or validate first when that distinction matters.

Sources: [specification: string types](https://go.dev/ref/spec#String_types),
[string conversions](https://go.dev/ref/spec#Conversions_to_and_from_a_string_type),
[range](https://go.dev/ref/spec#For_range),
[strings, bytes, runes, and characters](https://go.dev/blog/strings),
[unicode/utf8](https://pkg.go.dev/unicode/utf8).

### Choose text construction from the result and destination

| Need | Useful choice | Why or when another choice fits |
| --- | --- | --- |
| Combine a few strings in one expression | `"report: " + name` | Direct concatenation needs no formatter or builder lifecycle. |
| Format mixed values, width, precision, or quoting | `fmt.Sprintf("items=%d", count)` | The format expresses the layout; `strconv.Itoa` suits a single decimal integer conversion. |
| Combine existing string parts with a separator | `strings.Join(names, ", ")` | Join puts separators between parts; do not hand-manage a trailing separator. |
| Assemble many pieces incrementally into a string | A local `strings.Builder` | Write pieces during traversal, then call `String`; avoid repeatedly concatenating a growing prefix. |
| Accumulate bytes, or support both writes and reads | `[]byte` with append, or `bytes.Buffer` | Keep a byte-oriented result when the next operation needs bytes or a reader, rather than converting through strings. |
| Send output to an existing destination | `io.WriteString`, `fmt.Fprintf`, or the format's encoder with an `io.Writer` | Write there directly when the caller does not need the complete string. Check errors and partial effects. |

- Prefer the clearest suitable form. A short `+` expression is not the same workload as repeated growing-string concatenation.
- Do not replace every `+` or `Sprintf` with a builder on an assumed speed advantage. Measure meaningful hot paths.
- `strings.Builder` has a ready zero value. Do not copy a non-zero builder; pass a pointer when another function must write to it.
- Call `Grow` when a useful byte-size estimate justifies reservation; it does not add content or set an output limit.
- Concrete builder `Write` methods return nil errors. That does not make writes to an arbitrary `io.Writer` infallible.
- `bytes.Buffer` also has a ready zero value. Its `Bytes` result is borrowed storage, not an independent copy.
- A writer-oriented function can use a builder for a string, a buffer for bytes or later reads, or an actual output stream.
- Borrowing `io.Writer` does not imply ownership of a closer, atomic output, flushing, or durability.
- Use the format's encoder or template facilities when escaping or structured output matters; concatenation does not establish protocol validity.
- Before changing output timing or buffering, read [errors and I/O](errors-and-io.md#progress-and-failure-can-arrive-together).

### Write directly when the caller owns the destination

- This fragment uses `fmt` and `io`. Names are literal display text, not an escaped wire format.
- The writer receives each record directly. Failures propagate instead of becoming incomplete successful output.

```go fragment
func writeNames(w io.Writer, names []string) error {
	for _, name := range names {
		if _, err := fmt.Fprintf(w, "name: %s\n", name); err != nil {
			return fmt.Errorf("write name: %w", err)
		}
	}
	return nil
}
```

- The caller can supply a stream, `*strings.Builder` for a string, or `*bytes.Buffer` for bytes.
- Empty input writes nothing. The function borrows its writer; it never closes it.
- Failure can follow successful records or a partial write. The function does not promise atomic output.
- Use a local builder directly when no caller needs a writer-oriented operation; string assembly does not require an interface helper.

Sources: [specification: concatenation](https://go.dev/ref/spec#String_concatenation),
[fmt output families](https://pkg.go.dev/fmt#hdr-Printing), [strconv.Itoa](https://pkg.go.dev/strconv#Itoa),
[strings.Join](https://pkg.go.dev/strings#Join),
[strings.Builder](https://pkg.go.dev/strings#Builder), [Builder.Grow](https://pkg.go.dev/strings#Builder.Grow),
[bytes.Buffer](https://pkg.go.dev/bytes#Buffer), [Buffer.Bytes](https://pkg.go.dev/bytes#Buffer.Bytes),
[io.WriteString](https://pkg.go.dev/io#WriteString), [io.Writer](https://pkg.go.dev/io#Writer).

## Choose iteration from ordering, consumption, and lifetime

- Range supplies values, not aliases to every source element.
- Assigning to a ranged struct value changes that copy; index the original slice when the original element must change.
- A copied range value can still contain references to shared mutable state.
- Loop variables declared by `:=` are fresh per iteration. Assigning into preexisting variables with `=` still reuses those variables.
- Taking the address of a range value is not taking the address of the source element.
- Range evaluates its source expression before iteration, subject to the specification's constant-expression exception.
- A slice range does not extend its planned traversal because a variable is later assigned an appended slice.
- Integer range suits a count; ordinary slice range gives element indexes and values without a separate counter.

Sources: [specification: range](https://go.dev/ref/spec#For_range),
[Go 1.22 loop-variable change](https://go.dev/doc/go1.22#language).

### Iterator functions can avoid unnecessary materialization

- `iter.Seq[V]` supplies values through a yield callback; `iter.Seq2[K, V]` supplies pairs.
- An iterator must stop calling yield after it returns false, and cannot retain it for use after iteration returns.
- Respect early consumer exit in every custom iterator, including adapters that call other iterators.
- An `iter.Seq` type alone does not promise replay, a snapshot, deterministic order, or freedom from external effects.
- A sequence can recompute each traversal, read live state, or be explicitly single-use.
- Document those distinctions when callers cannot infer them from the source operation.
- Materialize with `slices.Collect` when callers need indexing or a collected result.
- Use `slices.Sorted(maps.Keys(m))` when map-key output needs a defined sorted order.
- Current `maps.Keys` returns an iterator, not a slice.
- Sorting or collecting copies the yielded values; referenced objects can still be shared.

### Early exit and repeated traversal are observable behavior

- This sequence recomputes each traversal and records how many values it produces.
- Breaking after the first value must stop production immediately.
- The final loop orders map output explicitly rather than depending on observed map iteration order.

```go
package main

import (
	"fmt"
	"iter"
	"maps"
	"slices"
)

func main() {
	produced := 0
	var numbers iter.Seq[int] = func(yield func(int) bool) {
		for number := 1; number <= 3; number++ {
			produced++
			if !yield(number) {
				return
			}
		}
	}

	for number := range numbers {
		fmt.Println(number)
		break
	}
	fmt.Println("produced", produced)
	fmt.Println(slices.Collect(numbers))
	fmt.Println("produced", produced)

	counts := map[string]int{"sent": 1, "queued": 2}
	for _, name := range slices.Sorted(maps.Keys(counts)) {
		fmt.Println(name, counts[name])
	}
}
```

Expected output:

```text
1
produced 1
[1 2 3]
produced 4
queued 2
sent 1
```

- This example's replay behavior comes from its implementation, not from `iter.Seq` itself.
- A sequence over mutable storage may observe changes between traversals; collecting is not necessarily a deep snapshot.
- Laziness can defer work, failures, and resource use until consumption.
- An iterator callback has no built-in error-result channel; choose an explicit error contract when traversal can fail.
- A direct processing function or existing stream API can be clearer than hiding failures in an iterator abstraction.
- `iter.Pull` adapts a sequence to pull-style access; its stop function must run when the consumer stops before exhaustion.
- For resource-dependent iteration and cleanup on early exit, read [errors and I/O](errors-and-io.md).
- For cancellation or traversal across goroutines, read [concurrency and context](concurrency-and-context.md).

Sources: [iter package](https://pkg.go.dev/iter), [specification: range](https://go.dev/ref/spec#For_range),
[maps.Keys](https://pkg.go.dev/maps#Keys), [slices.Collect](https://pkg.go.dev/slices#Collect),
[slices.Sorted](https://pkg.go.dev/slices#Sorted).

## Sources and their roles

| Source | Contribution |
| --- | --- |
| [Go specification](https://go.dev/ref/spec) | Copying, representation, identity, constraints, nil, slice/map operations, comparisons, text conversions, and iteration. |
| [Mechanics of append](https://go.dev/blog/slices) | Slice descriptors, capacity, aliasing, and method-receiver consequences. Historical generic limitations are not current restrictions. |
| [Robust generic slice functions](https://go.dev/blog/generic-slice-functions) | Updated descriptors, in-place mutation, obsolete references, and tail clearing. |
| [Deconstructing type parameters](https://go.dev/blog/deconstructing-type-parameters) | Underlying-type terms and preserving named collection types. |
| [Generic interfaces](https://go.dev/blog/generic-interfaces) | Minimal constraints, self-type relationships, pointer-method construction, and initialized-value alternatives. |
| [All your comparable types](https://go.dev/blog/comparable) | Constraint satisfaction versus strict comparability and interface-induced runtime panics. |
| [Strings, bytes, runes, and characters](https://go.dev/blog/strings) | Bytes, UTF-8, code points, offsets, and normalization limits. |
| [slices](https://pkg.go.dev/slices), [maps](https://pkg.go.dev/maps), and [iter](https://pkg.go.dev/iter) | Current standard collection and iterator contracts. |
| [strings](https://pkg.go.dev/strings), [fmt](https://pkg.go.dev/fmt), [bytes](https://pkg.go.dev/bytes), and [io](https://pkg.go.dev/io) | Concatenation alternatives, formatting, joining, string construction, byte-oriented buffers, and writer contracts. |
| [reflect](https://pkg.go.dev/reflect) and [time](https://pkg.go.dev/time) | Structural equality, nil inspection, and domain-specific instant equality. |
| [Google Go decisions](https://google.github.io/styleguide/go/decisions) and [Uber Go guide](https://github.com/uber-go/guide/blob/master/style.md) | Copying and nil conventions; recommendations must preserve documented borrowing, transfer, and representation contracts. |
