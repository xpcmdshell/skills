# Packages and APIs

- Read this reference when designing packages, functions, types, interfaces, constructors, ordinary branching, or public API changes.
- Use current Go 1.27 features. Ordinary functions, concrete types, interfaces, and generics are complementary tools.
- Choose boundaries from caller operations, state, invariants, and dependencies, not a preferred diagram or declaration count.
- Read [values and types](values-and-types.md) when a contract depends on copying, sharing, nil, equality, or iteration.
- Read [errors and I/O](errors-and-io.md) when the API owns resources, exposes failures, or processes streams.
- Read [concurrency and context](concurrency-and-context.md) when operations share state or own concurrent work.

## Keep packages cohesive and dependencies directed

- A package groups related implementation and presents a supported boundary to its callers.
- Unexported declarations are visible throughout their package, not only within their source file.
- Split files for navigation without creating extra package boundaries unnecessarily.
- Split packages when this isolates a real responsibility, dependency, or independently useful API.
- Keep a cohesive small program together when splitting only adds imports and indirection.
- Go rejects import cycles. Inspect responsibility and contract ownership before adding an interface to break one.
- Place a shared contract in another package only when it has a coherent role independent of its implementations.
- Avoid catch-all packages named `util`, `common`, `types`, or `interfaces` that accumulate unrelated responsibilities.
- A canonical protocol package can be valid; its purpose must explain why consumers depend on it.
- Do not require service, repository, factory, port, or adapter layers when ordinary Go boundaries meet the need.
- For module paths, command layout, and `internal` directories, read [modules and tooling](modules-and-tooling.md).

Sources: [specification: packages](https://go.dev/ref/spec#Packages), [package names](https://go.dev/blog/package-names),
[Google: least mechanism](https://google.github.io/styleguide/go/guide#least-mechanism).
The specification defines visibility and imports; the organization advice supplies engineering defaults.

## Choose the smallest mechanism that expresses the contract

| Need | Useful starting point | What changes the choice |
| --- | --- | --- |
| Compute a result from supplied inputs | Function | Related state or invariants can justify a type with methods. |
| Supply an operation | Function parameter | Use an interface when named operations or an established behavioral protocol help consumers. |
| Adapt or decorate an HTTP handler | `http.HandlerFunc`, or a function taking and returning `http.Handler` | Use a concrete wrapper when it owns state or must expose additional operations. |
| Keep state and valid transitions together | Concrete type with methods | A stateless namespace does not need an object lifecycle. |
| Use one particular representation or implementation | Concrete parameter | Use an interface when consumers require behavior independent of that implementation. |
| Consume interchangeable behavior | Existing interface or consumer-defined interface | Its full semantics must fit, not only its method names. |
| Preserve relationships between input and result types | Type parameters | A behavioral interface is simpler when no extra type relationship is needed. |
| Inspect unrelated runtime shapes | Reflection, where justified | A known static contract usually needs less runtime machinery. |

- A package already names related functions. A stateless formatter does not need a `Formatter` struct and constructor solely for namespacing.
- A function argument supplies a callback directly; a one-method interface helps when callers need a named behavioral contract.
- For HTTP middleware, `func(next http.Handler) http.Handler` composes the existing protocol without a new interface for every stage.
- Keep middleware that owns useful policy or state. Remove pass-through layers that only forward calls and complicate ordering or errors.
- A client with shared dependencies, a resource lifetime, or enforced invariants can legitimately be a struct with methods.
- Hide implementation decisions without hiding consequential mutation, failure, or lifetime behavior.
- Reuse established formats and standard packages before building equivalent frameworks.
- Return multiple results when absence or failure needs a separate signal.
- A `(value, ok)` result suits ordinary absence when callers need no explanation.
- An `error` result suits failure that needs explanation or semantic inspection.
- Sentinels such as an empty string can be appropriate when the operation deliberately treats them as ordinary results.
- Do not replace an established result contract solely to match a preferred pattern.

Sources: [Code Review Comments: in-band errors](https://go.dev/wiki/CodeReviewComments#in-band-errors),
[when to use generics](https://go.dev/blog/when-generics),
[Google: simplicity](https://google.github.io/styleguide/go/guide#simplicity),
[http.HandlerFunc](https://pkg.go.dev/net/http#HandlerFunc), [http.StripPrefix](https://pkg.go.dev/net/http#StripPrefix).
These handler APIs illustrate function adaptation and protocol composition, not a ban on wrapper types.

## Keep ordinary branching local

- Handle an error or rejected input beside the operation. Return or continue when that path is finished.
- Omit `else` after an unconditional exit; the successful path can continue at the outer indentation level.
- Keep `else` when both branches produce useful alternatives or recovery continues into later work.
- Use `if err := operation(); err != nil` when only that statement needs the error.
- Use a scoped initializer for a lookup or switch value when its lifetime ends with that statement, including its `else` branches.
- Declare a result before an error guard when later work needs it; do not nest the successful path just to retain initializer scope.
- A short declaration in a nested block can shadow an outer variable instead of updating it. Use assignment when replacement is intended.
- Use `switch value` to group alternatives of the same value; comma-separated cases share an action.
- Use `switch { ... }` when several conditions express a decision more clearly than an `if`/`else if` chain.
- The first matching case runs. Case order therefore carries policy when conditions overlap.
- Cases do not fall through automatically. Do not add C-style `break` statements after every case.
- Use `if` for a straightforward two-way decision. A switch is an option for clarity, not a required rewrite.
- Before moving an error check, preserve operations that must process partial results; read [errors and I/O](errors-and-io.md#progress-and-failure-can-arrive-together).

### Select display style, then choose the largest applicable unit

- This complete command takes a decimal byte count and a display style: `size SIZE STYLE`.
- `bytes` preserves the integer count. Empty or `human` style selects B, KiB, or MiB; styles are case-insensitive.
- Parsing and domain errors exit before formatting. The scoped value switch handles style selection.
- The expressionless switch puts MiB before KiB because a MiB-sized value also satisfies the KiB condition.
- KiB and MiB output round to one decimal place. These units are display choices, not application resource limits.

```go
package main

import (
	"fmt"
	"os"
	"strconv"
	"strings"
)

func sizeLabel(raw, style string) (string, error) {
	size, err := strconv.ParseInt(raw, 10, 64)
	if err != nil {
		return "", fmt.Errorf("parse size %q: %w", raw, err)
	}
	if size < 0 {
		return "", fmt.Errorf("negative size %d", size)
	}

	switch normalized := strings.ToLower(style); normalized {
	case "bytes":
		return fmt.Sprintf("%d B", size), nil
	case "", "human":
		// Select a display unit below.
	default:
		return "", fmt.Errorf("unsupported style %q", style)
	}

	const (
		kiB = 1 << 10
		miB = 1 << 20
	)
	switch {
	case size >= miB:
		return fmt.Sprintf("%.1f MiB", float64(size)/miB), nil
	case size >= kiB:
		return fmt.Sprintf("%.1f KiB", float64(size)/kiB), nil
	default:
		return fmt.Sprintf("%d B", size), nil
	}
}

func main() {
	if len(os.Args) != 3 {
		fmt.Fprintln(os.Stderr, "usage: size SIZE STYLE")
		os.Exit(2)
	}
	label, err := sizeLabel(os.Args[1], os.Args[2])
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
	if _, err := fmt.Fprintln(os.Stdout, label); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
```

| Arguments | Observable result |
| --- | --- |
| `2048 bytes` | `2048 B` |
| `2048 HUMAN` | `2.0 KiB` |
| `1048576 human` | `1.0 MiB`, not `1024.0 KiB` |
| `1023 human` | `1023 B` |
| `bad human`, `-1 human`, or `2048 unknown` | Useful stderr, status 1, and no success output. |

- The empty `human` case ends that switch normally and continues below; it does not fall through into `default`.
- At an I/O boundary, an error can still follow a partial write. This command does not promise atomic or durable output.

Sources: [Effective Go: if](https://go.dev/doc/effective_go#if), [switch](https://go.dev/doc/effective_go#switch),
[Code Review Comments: indent error flow](https://go.dev/wiki/CodeReviewComments#indent-error-flow),
[specification: declarations and scope](https://go.dev/ref/spec#Declarations_and_scope),
[expression switches](https://go.dev/ref/spec#Expression_switches),
[strconv.ParseInt](https://pkg.go.dev/strconv#ParseInt), [fmt formatting](https://pkg.go.dev/fmt#hdr-Printing).

## Make construction and zero values agree

- Go initializes every variable. Zero initialization applies recursively to array elements and struct fields.
- Aim for a useful zero value when that matches the type's role.
- `bytes.Buffer` is ready to use when zero-valued; a client requiring credentials may legitimately require construction.
- A constructor is an ordinary function, not a language-enforced allocation path.
- Keep representation unexported when arbitrary field changes would violate required invariants.
- An exported type remains zero-constructible even when every field is unexported. Define that zero state's behavior.
- Export fields when callers should construct and edit ordinary records or configuration directly.
- Do not add getters and setters merely to imitate another language's object model.

| Form | Meaning | Appropriate use |
| --- | --- | --- |
| `var value T` | A zero value of `T` | An empty accumulator or ready-to-use value. |
| `T{Field: value}` | A composite value with named initial fields | Data or configuration with useful field-level documentation. |
| `new(T)` | A pointer to a fresh zero value | The operation needs a pointer to zero-initialized state. |
| `new(expression)` | A pointer to a fresh variable initialized from the expression | Optional scalar values without a custom pointer helper. |
| `make` | An initialized slice, map, or channel value | Initialize the collection or communication state actually required. |
| `New`, `Open`, `Dial`, or another ordinary function | Package-defined initialization or acquisition | Validation, required dependencies, setup, or owned resources. |

- `new` does not imply heap allocation; allocation placement is a compiler decision.
- `new([]T)` points to a nil slice; it does not create a populated slice or a backing array.
- A nil slice supports append. A nil map needs initialization before insertion.
- A defined scalar type distinguishes meanings but does not validate representable values supplied by explicit conversion.
- Named constants on an integer type do not create a closed enumeration. Validate values when the domain requires it.
- Give zero a useful default or an explicit invalid meaning; neither always skipping nor always using zero is correct.

Sources: [specification: zero value](https://go.dev/ref/spec#The_zero_value),
[allocation](https://go.dev/ref/spec#Allocation),
[Effective Go: construction](https://go.dev/doc/effective_go#composite_literals),
[Go doc comments: types](https://go.dev/doc/comment#types).

### A zero-value accumulator can initialize its own map

- `Counts` owns its map and exposes only the operations callers need.
- Reads on its initial nil map work; the first write initializes storage.
- Pointer receivers preserve changes to the containing value.
- This example provides no concurrency guarantee or independent-copy operation.

```go
package main

import "fmt"

// Counts records how many times each name is added.
// The zero value is ready to use.
type Counts struct {
	byName map[string]int
}

func (c *Counts) Add(name string) {
	if c.byName == nil {
		c.byName = make(map[string]int)
	}
	c.byName[name]++
}

func (c *Counts) Lookup(name string) (int, bool) {
	n, ok := c.byName[name]
	return n, ok
}

func main() {
	var counts Counts
	counts.Add("queued")
	counts.Add("queued")
	fmt.Println(counts.Lookup("queued"))
	fmt.Println(counts.Lookup("missing"))
}
```

Expected output:

```text
2 true
0 false
```

- Copying a populated `Counts` still shares its map. A useful zero value does not imply independent copies.
- If this state becomes shared concurrently, use the ownership and synchronization guidance in [concurrency and context](concurrency-and-context.md).

### Choose optional configuration from the actual caller need

- Keep a meaningful two-state boolean when the operation and call site make it clear.
- Prefer a named mode or separate operations when there are distinct policies or invalid flag combinations.
- Use an options struct when fields form a coherent configuration and named call-site values improve clarity.
- Use functional options when an extensible construction API benefits from them, not after an arbitrary parameter threshold.
- For functional options, define defaults, duplicate-option behavior, validation, and any retained references.
- For options fields, distinguish absence from an explicit zero value when both meanings matter.

The following contextual declarations use a pointer to distinguish a default from explicitly disabling retries:

```go fragment
type Options struct {
	// Retries is the retry count. Nil uses the package default; zero disables retries.
	Retries *int
}

options := Options{Retries: new(0)}
```

- This is one representation choice, not a requirement that every option become a pointer.
- An explicit presence flag or separate policy type can better fit serialization or a richer domain.
- Supplying a caller-owned pointer introduces sharing unless construction copies the pointed-to value.
- Decide whether configuration is read during construction or retained for later use, and document the choice.

Sources: [keeping modules compatible: options](https://go.dev/blog/module-compatibility),
[Uber: functional options](https://github.com/uber-go/guide/blob/master/style.md#functional-options).
Uber's option-interface representation is a house preference; options structs and function-based options remain valid alternatives.

## Put interfaces with their requirements

- Define an interface around the behavior a consumer needs, not every method an implementation happens to expose.
- Prefer existing interfaces when their semantics match. Avoid redefining `io.Reader` under a domain-themed name.
- Keep a private consumer interface unexported unless callers need to name or implement the contract explicitly.
- Introduce an interface for actual substitution, protocol, or decoupling needs, not a speculative mock of every concrete type.
- Interface size follows its responsibility; no method-count quota establishes a useful abstraction.
- A small interface can still need detailed semantics for mutation, retention, errors, ordering, or concurrent calls.

Context: these declarations belong to a consumer package that formats labels. The function body is omitted.

```go fragment
package dispatch

type nameLookup interface {
	Lookup(id string) (name string, ok bool)
}

func AddressLabel(names nameLookup, id string) (string, bool)
```

- A concrete directory type can satisfy this contract without importing `dispatch` or declaring that relationship.
- A public function can accept an unexported interface; callers pass matching values without naming the interface.
- The implementing package normally returns its concrete type so consumers can use its complete supported API.
- Producer-owned interfaces are appropriate when the interface itself is the product, such as a canonical I/O protocol.
- Generated service boundaries can also define canonical interfaces; do not duplicate them without an actual consumer need.
- Returning an interface can deliberately hide interchangeable implementations or expose only the promised protocol.
- `error` and `hash.Hash` illustrate legitimate interface results. “Return concrete types” is a default, not a law.
- Returning an interface does not prohibit type assertions or make extra exported methods private.
- Make operations unexported when they are truly implementation details.

Sources: [Code Review Comments: interfaces](https://go.dev/wiki/CodeReviewComments#interfaces),
[Google: interfaces](https://google.github.io/styleguide/go/best-practices#interfaces),
[Effective Go: generality](https://go.dev/doc/effective_go#generality).

### Structural implementation is not behavioral proof

- Method signatures must match exactly. An implementation cannot substitute a narrower parameter or a more concrete result type.
- A compile-time assignment can protect a deliberate interface commitment.
- It checks method sets, not whether the implementation honors the documented behavior.
- Ordinary interface parameters are passed as values; their dynamic value can already contain a pointer.
- Use a pointer to an interface only when replacing the interface variable itself is the intended operation.
- For typed nil and dynamic-value behavior, read [values and types](values-and-types.md#nil-and-interface-values).

Context: `Handler` is a declared concrete type that promises to implement `http.Handler`.

```go fragment
var _ http.Handler = (*Handler)(nil)
```

- An `io.Writer` implementation, for example, must not retain or modify its supplied byte slice.
- A matching `Write` signature alone cannot establish those obligations.
- Read [errors and I/O](errors-and-io.md) before implementing stream interfaces or translating their results.

Sources: [specification: interface implementation](https://go.dev/ref/spec#Implementing_an_interface),
[io.Writer](https://pkg.go.dev/io#Writer),
[FAQ: interface assertions](https://go.dev/doc/faq#guarantee_satisfies_interface).

## Choose receivers from mutation, copying, and method sets

| Situation | Usual choice | Reason or important limit |
| --- | --- | --- |
| Change fields or replace the receiver's value | Pointer receiver | A value receiver changes only its copy of those fields. |
| Preserve one identity or avoid copying non-copyable state | Pointer receiver | Inspect field contracts; a pointer receiver does not stop copies elsewhere. |
| Represent a naturally value-like scalar, array, or record | Value receiver | Copying is meaningful and safe; changes can return a new value. |
| Mutate elements of a map or slice without replacing its descriptor | A value receiver can suffice | Copied descriptors still refer to shared storage. |
| Reslice or replace a slice value held by the caller | Pointer receiver, or return the new slice | Updating a local descriptor does not update another descriptor. |
| Reduce a demonstrated copying cost | Compare real workloads | Pointer choice alone does not predict allocation or overall speed. |

- Prefer consistent receivers when semantics permit, but preserve correct copying and interface behavior first.
- Mixed receiver sets can be valid; `time.Time` has value operations and pointer decoding methods.
- Copying a receiver is not a deep copy, an immutable snapshot, or synchronization.
- Nil pointer receivers can have intentional behavior; dereferencing nil still panics.
- Document nil handling instead of assuming every implementation accepts it.

### Calls and interface implementation answer different questions

- The method set of defined `T` contains methods declared on `T`.
- The method set of `*T` contains methods declared on both `T` and `*T`.
- Calling a pointer method on an addressable variable can use automatic address-taking.
- That shorthand does not add pointer methods to `T`'s method set.
- Map elements and values stored inside interfaces do not become addressable through this shorthand.
- A map of pointers permits pointer methods because the element's pointer type already has those methods.

```go
package main

import "fmt"

type Counter int

func (c *Counter) Increment() {
	*c++
}

type incrementer interface {
	Increment()
}

var _ incrementer = (*Counter)(nil)

func main() {
	var count Counter
	count.Increment()
	_, valueImplements := any(count).(incrementer)
	_, pointerImplements := any(&count).(incrementer)
	fmt.Println(count, valueImplements, pointerImplements)
}
```

Expected output: `1 false true`.

Context: with those declarations, the following are intentionally invalid counterexamples, not runnable code.

```go fragment
var _ incrementer = Counter(0) // Counter lacks Increment in its method set.

counts := map[string]Counter{"queued": 0}
counts["queued"].Increment() // A map element cannot use automatic address-taking.
```

- A read-modify-write update can suit a value map; pointer-valued entries instead introduce identity, sharing, and possible nil values.
- Choose that representation from the data's semantics, not only to remove a compiler diagnostic.

Sources: [specification: method sets](https://go.dev/ref/spec#Method_sets),
[calls](https://go.dev/ref/spec#Calls),
[address operators](https://go.dev/ref/spec#Address_operators),
[Code Review Comments: receiver type](https://go.dev/wiki/CodeReviewComments#receiver-type).

## Use generics to preserve useful type relationships

- Use type parameters when an operation or container should preserve statically checked relationships across types.
- Keep an ordinary interface parameter when the implementation only needs its methods and no extra type relationship.
- Use a concrete type when the operation genuinely depends on that representation or behavior.
- Reuse `slices`, `maps`, and `cmp` before implementing common collection algorithms.
- Repetition can reveal a generic operation, but no repetition count is required to justify a general-purpose API.
- Require only the operations the implementation needs; unnecessary constraints exclude otherwise valid callers.
- Do not add `comparable` to a general container merely because one possible implementation uses a map.
- A comparison callback can handle types without methods; a comparison method can support type relationships and useful zero values.
- Ordered constraints suit domains where built-in ordering is the intended ordering.
- Do not infer performance from generic versus interface syntax; use measurements for a real performance decision.

Sources: [when to use generics](https://go.dev/blog/when-generics),
[generic interfaces](https://go.dev/blog/generic-interfaces).
These sources explain tradeoffs, not a requirement to replace every ordinary interface with a type parameter.

### Generic methods can keep operations with their receiver

- A generic method can introduce a result type independent of the receiver's element type.
- Here, transformation belongs to a batch's API and returns another typed batch.
- The function allocates an independent outer slice; the callback determines the meaning and sharing of result elements.

```go
package main

import "fmt"

type Batch[E any] []E

func (b Batch[E]) Map[F any](convert func(E) F) Batch[F] {
	result := make(Batch[F], len(b))
	for i, value := range b {
		result[i] = convert(value)
	}
	return result
}

func main() {
	names := Batch[string]{"fern", "oak"}
	var lengths Batch[int] = names.Map(func(name string) int {
		return len(name)
	})
	fmt.Println(lengths)
	fmt.Println(names)
}
```

Expected output:

```text
[4 3]
[fern oak]
```

- A package-level generic function remains suitable when there is no natural receiver or it better serves existing callers.
- Do not create a receiver type solely to imitate a static-method namespace.
- Interface methods cannot declare type parameters, and generic methods do not implement interface methods.
- Methods of a generic type can still implement an ordinary instantiated interface when their signatures match.
- Receiver parameter names declare type parameters; writing a concrete-looking name there does not specialize the method.
- Use current inference where it works; supply explicit type arguments when they express necessary information or clarify a call.
- Read [type identity and constraints](values-and-types.md#type-identity-and-constraints) for aliases, underlying-type terms, and comparability.

Sources: [specification: method declarations](https://go.dev/ref/spec#Method_declarations),
[Go 1.27 language changes](https://go.dev/doc/go1.27#language),
[deconstructing type parameters](https://go.dev/blog/deconstructing-type-parameters).
Current specification and release notes take precedence over older claims that generic methods are unavailable.

## Use embedding as deliberate API composition

- Interface embedding combines requirements; struct embedding stores a field and can promote its fields and methods.
- Neither creates a subtype relationship or virtual dispatch through an outer receiver.
- A promoted method runs with its declared embedded receiver.
- Use a named field and explicit forwarding when only selected operations should be public.
- Embed when the promoted behavior genuinely belongs to the outer API, not just to save typing.
- Embedded pointers can make zero-value operations unsafe when those operations dereference a nil embedded field.
- Embedded synchronization state changes copying obligations and can accidentally expose locking methods.
- Even an unexported embedded type can promote exported methods.
- Adding methods to an embedded type can change interface satisfaction or create selector ambiguities.

### Promotion does not override the embedded implementation

- Current struct literals can initialize promoted fields directly when traversed embedded fields are not pointers.
- `Shipment.Label` hides the promoted method for that selector; it does not change `Stamp.Summary`'s internal call.

```go
package main

import "fmt"

type Stamp struct {
	Region string
}

func (s Stamp) Label() string {
	return s.Region
}

func (s Stamp) Summary() string {
	return "region=" + s.Label()
}

type Shipment struct {
	Stamp
	ID string
}

func (s Shipment) Label() string {
	return s.ID
}

func main() {
	shipment := Shipment{Region: "west", ID: "P7"}
	fmt.Println(shipment.Region, shipment.Label(), shipment.Summary())
}
```

Expected output: `west P7 region=west`.

- Literal keys cannot select overlapping fields, such as both an embedded struct and a promoted field inside it.
- A literal cannot initialize a promoted field through an embedded pointer; construct that pointed-to value explicitly.
- Exported embedded fields and their supported promoted operations become compatibility commitments.
- Uber advises avoiding embedding in public structs. Treat that as a strong encapsulation default, not a language ban.

Sources: [specification: struct types](https://go.dev/ref/spec#Struct_types),
[struct literals](https://go.dev/ref/spec#Composite_literals),
[selectors](https://go.dev/ref/spec#Selectors),
[Uber: public embedding](https://github.com/uber-go/guide/blob/master/style.md#avoid-embedding-types-in-public-structs).

## Make names and documentation part of the API

- Read exported names with their package prefix: `archive.Reader` is clearer than `archive.ArchiveReader`.
- Use concise lowercase package names and MixedCaps identifiers; keep familiar initialisms consistent, such as `HTTP`, `URL`, and `ID`.
- Use short familiar locals where scope makes them clear; give unusual and public concepts descriptive names.
- Use consistent receiver names that identify the type rather than `this` or `self`.
- A getter normally uses `Owner`, not ceremonial `GetOwner`; an actual fetch operation may legitimately be named `Get`.
- Preserve canonical method meanings and signatures when implementing interfaces such as `String`, `Read`, or `WriteTo`.
- Function parameter names aid documentation; Go does not provide keyword calls that bind to those names.
- Named results can clarify otherwise ambiguous results, but should not exist merely to enable a bare return.

| Contract detail | Document when consequential |
| --- | --- |
| Input meaning | Units, accepted forms, normalization, validation, and the meaning of zero or nil. |
| Results | Absence, ordering, independence, view validity, and partial results on failure. |
| Mutation | Which supplied or reachable values change and what remains unchanged on rejection. |
| State | Useful zero values, copying restrictions, configuration timing, and initialization requirements. |
| Interfaces | Implementer obligations, including retention, failures, concurrency, and cleanup. |
| Execution | Blocking behavior, cancellation, repeatability, and resource ownership. |
| Evolution | Supported extension points, compatibility commitments, and deprecated alternatives. |

- Give packages an overview and important types and operations useful introductory sentences.
- Use Go doc-comment headings, links, lists, and `Deprecated:` paragraphs where they help readers.
- Inspect rendered `go doc` output when changing public documentation.
- Do not duplicate every parameter type in prose; explain meaning and effects that the signature cannot express.

Sources: [Effective Go: names](https://go.dev/doc/effective_go#names),
[Code Review Comments: initialisms](https://go.dev/wiki/CodeReviewComments#initialisms),
[Go doc comments](https://go.dev/doc/comment).

## Preserve public contracts deliberately

- Inspect real callers and published behavior before changing an API.
- Prefer local simplification behind an existing boundary when compatibility is required.
- Update callers and documentation together when the requested work changes that boundary.
- Public contracts include behavior, not only successful compilation.

| Change | Compatibility question |
| --- | --- |
| Add an optional variadic parameter | Do callers assign the function to its original function type? Ordinary calls can still work while assignments break. |
| Add a method to an open interface | Can existing external implementations still satisfy it? A separate optional capability can preserve the original contract. |
| Add an optional capability check | Does a valid implementation of the original interface still work through a correct fallback? |
| Add a concrete method | Can embedding create an ambiguous selector or accidental new interface implementation? |
| Add a struct field | Does its zero value preserve behavior? Does comparability, equality, serialization, or construction change? |
| Change a receiver | Do value and pointer callers retain their method sets and copying semantics? |
| Add a generic constraint | Does it reject previously valid type arguments? |
| Replace a shared view with a copy | Do callers rely on mutation visibility, ownership transfer, or validity timing? |
| Change zero, nil, or default behavior | Do existing callers still get the promised operation and representation? |
| Replace materialized results with iterators | Do replay, evaluation timing, failures, and resource lifetime remain correct? |

- Use keyed literals for structs from other packages to avoid coupling to field order and the full field list.
- An unexported method can restrict direct external interface implementations, but embedding can still propagate it.
- A type alias preserves identity when an existing type needs another supported name or a staged move.
- A defined type creates a distinct type and does not inherit the original defined type's methods.
- Do not add aliases, wrappers, or deprecation layers for private callers that can simply change together.
- A deprecation comment does not authorize breaking a published compatibility promise.
- Go's standard-library compatibility exceptions are not automatically a third-party package's policy.

Sources: [keeping modules compatible](https://go.dev/blog/module-compatibility),
[Go compatibility expectations](https://go.dev/doc/go1compat),
[specification: type declarations](https://go.dev/ref/spec#Type_declarations).

## Sources and their roles

| Source | Contribution |
| --- | --- |
| [Go specification](https://go.dev/ref/spec) | Package visibility, method sets, construction, embedding, type identity, constraints, and current generic methods. |
| [Go 1.27 release notes](https://go.dev/doc/go1.27) | Current generic-method, inference, and promoted-literal behavior; resolves obsolete source claims. |
| [Effective Go](https://go.dev/doc/effective_go) | Ordinary branching, naming, construction, composition, and interface rationale. Its age warning requires current-contract checks. |
| [net/http handler APIs](https://pkg.go.dev/net/http#HandlerFunc) | Function adaptation and middleware using an existing behavioral protocol. |
| [Go Code Review Comments](https://go.dev/wiki/CodeReviewComments) | Consumer interfaces, receivers, naming, and result conventions. Recommendations are not compiler restrictions. |
| [Go doc comments](https://go.dev/doc/comment) | Public documentation content, syntax, and rendering. |
| [Keeping modules compatible](https://go.dev/blog/module-compatibility) | Options, optional capabilities, signatures, and struct evolution. |
| [When to use generics](https://go.dev/blog/when-generics) and [generic interfaces](https://go.dev/blog/generic-interfaces) | Generic operations, comparator alternatives, type relationships, and unnecessary constraints. |
| [Google Go style](https://google.github.io/styleguide/go/) | Clarity, least mechanism, and interface ownership with meaningful exceptions. Organization-specific policies remain conditional. |
| [Uber Go guide](https://github.com/uber-go/guide/blob/master/style.md) | Public embedding risks and configuration choices, not mandatory representations or quotas. |
