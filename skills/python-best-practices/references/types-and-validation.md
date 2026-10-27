# Types and validation

## Describe contracts and establish runtime facts

- Use this reference when adding annotations, choosing records, or accepting data from outside a trusted boundary.
- An annotation describes a contract to readers and tools. Ordinary annotations do not enforce runtime values.
- Parsing establishes format structure. Validation establishes the constraints that later operations rely on.
- Keep those responsibilities explicit instead of treating successful type checking as runtime proof.
- Examples target Python 3.15. Use current type syntax unless an existing compatibility contract requires an older form.
- Check runtime consumers as well as the project's configured type checker before changing annotation behavior.
- For architecture and interface selection, read [API design](api-design.md). This reference covers representation and typing mechanics.

| Kind of guidance | Authority and use |
| --- | --- |
| Typing semantics | The [typing specification](https://typing.python.org/en/latest/spec/index.html) defines assignability and typing constructs. |
| Runtime behavior | Version-matched Python and library documentation defines what executing code does. |
| Typing recommendations | Advice pages suggest useful defaults. Apply them to the actual contract rather than as language rules. |
| Project policy | Existing annotations, checking boundaries, and supported versions guide incremental work. |

## Choose a record from its operations

| Representation | Good fit | Important limit |
| --- | --- | --- |
| Plain `dict` | Dynamic key lookup or a homogeneous mapping with no fixed record shape. | A broad value union does not relate each key to its specific type. |
| `TypedDict` | A fixed dictionary-shaped contract, including existing payload APIs. | Values remain ordinary dictionaries. No runtime field validation occurs. |
| Dataclass | Named Python state with attributes, defaults, methods, and useful generated behavior. | Field annotations do not generally validate constructor arguments. |
| `NamedTuple` | A named record that deliberately retains tuple behavior and positional unpacking. | Field order and tuple compatibility become part of its API. |
| Ordinary class | State changes need controlled methods or a custom lifecycle. | Avoid writing boilerplate that a suitable dataclass already supplies. |
| Validating model or schema library | Nested input, constraints, detailed errors, or schema and serialization integration. | Configuration can permit conversions or unknown fields that the application does not want. |

- Keep a wire representation when dictionary operations are genuinely useful.
- Convert to a domain record when named attributes and domain operations simplify later work.
- Do not create duplicate representations unless conversion isolates a real boundary or responsibility.
- Reuse an established project validation library when it fits. A small boundary parser needs no new dependency by default.

### Dataclasses generate behavior, not domain guarantees

- Choose generated equality, ordering, representation, and constructor shape deliberately.
- Default dataclass equality compares the fields of instances with the same concrete class.
- Exclude fields from representation when exposing them would disclose sensitive data.
- Use `field(default_factory=...)` when each instance needs its own mutable default.
- `frozen=True` prevents ordinary field assignment. It does not recursively freeze referenced objects.
- `slots=True` changes layout and attribute behavior. Use it for an identified need, not as automatic decoration.
- A `__post_init__` check can enforce constructor constraints that all construction paths need.
- That check does not automatically validate future assignments or mutations inside a field.
- Read [state and iteration](state-and-iteration.md#separate-read-only-access-from-immutable-data) for read-only access, snapshots, mutation, equality, and copying.

### TypedDict separates key presence from value type

- `Required` and `NotRequired` describe whether a key must exist, not whether its value can be `None`.
- `total=False` makes that definition's keys non-required unless explicitly marked otherwise.
- Use membership checks when missing and explicitly null values have different meanings.
- A static shape does not reject untrusted input. Validate before assigning it that trusted meaning.
- Do not use `isinstance(value, SomeTypedDict)`. A `TypedDict` is not a runtime validator.

```python
from typing import NotRequired, TypedDict


class Receipt(TypedDict):
    reference: str
    note: NotRequired[str | None]


def receipt_note(receipt: Receipt) -> str:
    if "note" not in receipt:
        return "No note supplied"
    note = receipt["note"]
    if note is None:
        return "Note explicitly disabled"
    return note


ordinary: Receipt = {"reference": "northbound"}
without_note: Receipt = {"reference": "southbound", "note": None}
print(receipt_note(ordinary))
print(receipt_note(without_note))
```

- An empty string remains a valid supplied note here. Truth testing would incorrectly replace it.
- `ReadOnly` items restrict writes through a typed contract, not mutation of contained objects.
- Check interpreter, backport, and checker support before using newer `TypedDict` openness or read-only features.

## Validate external data before using it as domain state

1. Parse the transport format with its established parser.
2. Check the root shape, required fields, and relevant nested values.
3. Decide how missing values, null values, and valid false-like values differ.
4. Apply documented conversion and normalization rules.
5. Check domain constraints and relationships between fields.
6. Return a useful trusted representation or a failure that identifies the invalid field without exposing secrets.

- Decide whether unknown fields are rejected, ignored, or preserved. Accidental defaults are not a schema policy.
- Validate at a trust boundary, then avoid repeated checks inside operations that already receive validated values.
- Revalidate when values can change outside the trusted owner or cross a new trust boundary.
- Use explicit checks for required input validation, permissions, and domain constraints. Optimization can remove `assert` statements.
- Reserve assertions for internal expectations and tests, not external-input handling.
- Do not substitute `cast` or a return annotation for these checks.
- Read [errors and resources](errors-and-resources.md) for error translation, sensitive diagnostics, and format-specific parsing concerns.

Sources: [assert statements](https://docs.python.org/3.14/reference/simple_stmts.html#the-assert-statement) and [typing runtime behavior](https://docs.python.org/3.14/library/typing.html).

### A small parser can establish a precise record

- This print request requires a nonblank title and a positive integer copy count.
- A missing count defaults to one. Explicit null, booleans, and numeric strings are invalid counts.
- Titles lose surrounding whitespace. Other keys are ignored by this boundary's explicit policy.
- The parser constructs a fresh record. Direct construction elsewhere still relies on trusted callers.

```python
import json
from dataclasses import dataclass


@dataclass(frozen=True, kw_only=True)
class PrintRequest:
    title: str
    copies: int


def load_print_request(text: str) -> PrintRequest:
    value: object = json.loads(text)
    if not isinstance(value, dict):
        raise ValueError("print request must be an object")  # noqa: TRY004

    title: object = value.get("title")
    if not isinstance(title, str) or not title.strip():
        raise ValueError("title must be a nonblank string")

    copies: object = value.get("copies", 1)
    if isinstance(copies, bool) or not isinstance(copies, int):
        raise ValueError("copies must be an integer")  # noqa: TRY004
    if copies <= 0:
        raise ValueError("copies must be positive")

    return PrintRequest(title=title.strip(), copies=copies)


request = load_print_request('{"title": "  Station map  ", "copies": 2}')
print(request.title, request.copies)
try:
    load_print_request('{"title": "Station map", "copies": false}')
except ValueError as error:
    print(error)
```

- `ValueError` describes invalid content in the supplied string. The targeted Ruff suppressions preserve that exception contract.
- `bool` is a subclass of `int`, so a plain integer instance check would admit booleans.
- Assigning decoded data to `object` prevents its dynamic type from granting arbitrary operations elsewhere.
- `isinstance(value, dict)` checks the container, not its element types. Each used field still needs validation.
- Successful JSON decoding does not establish domain validity.
- A larger nested schema can justify a validation library instead of expanding handwritten shape checks.

### Configure validating libraries for the actual boundary

- A validating library may both check and transform data. Decide which transformations are acceptable.
- With Pydantic, inspect conversion, extra-field, strictness, and mutation settings for the selected version.
- Pydantic can convert values such as numeric strings and ignore extra fields under default settings.
- Strict mode behavior depends on the target type and whether input arrives as Python objects or JSON.
- For example, strict JSON validation can still accept strings for date types.
- Validate nested values and cross-field relationships when the domain requires them.
- Avoid construction paths that bypass validation when input is untrusted.
- Validation at creation does not guarantee that later mutation preserves every constraint.
- Use schema serialization deliberately. Dataclass conversion alone is not a versioned wire-format policy.

## Annotate the useful boundaries

- Prioritize public functions, methods, domain records, callbacks, and difficult relationships.
- Add `-> None` to operations that return no useful result.
- Include `None` explicitly when it is a permitted value. A default of `None` does not make `int` accept it statically.
- Let straightforward local assignments infer their types. Annotate empty containers or ambiguous values when inference needs help.
- Prefer readable built-in generics and unions when supported, such as `list[str]` and `str | None`.
- Preserve honest union results. Replacing them with `Any` removes useful obligations from callers.
- Keep existing gradual checking boundaries during maintenance. Strengthen them where the change benefits from clearer contracts.
- Read [packaging and tooling](packaging-and-tooling.md) for checker configuration and discoverable public library annotations.

### Match the operations the implementation really needs

| Operation needed | Candidate annotation | Contract to remember |
| --- | --- | --- |
| One traversal | `Iterable[T]` | Input may be a one-shot iterator. Document consumption. |
| Advance a cursor | `Iterator[T]` | The consumer can call `next`; exhaustion is stateful. |
| Length and indexed access | `Sequence[T]` | Require meaningful sequence behavior, not just any iterable. |
| Key lookup without writes | `Mapping[K, V]` | Other owners can still mutate the underlying object. |
| Key assignment or deletion | `MutableMapping[K, V]` | Mutation belongs to the stated caller-visible contract. |
| List-specific changes or semantics | `list[T]` | A concrete type is appropriate when concrete operations are required. |

- Accept the broadest input contract that the implementation actually supports, not the broadest available type name.
- An `Iterable` does not promise independent repeated passes. Materialize deliberately or require a stronger representation.
- Read-only interfaces do not establish immutable contents. Use the [state and snapshot guidance](state-and-iteration.md#separate-read-only-access-from-immutable-data) when stability matters.
- Return a concrete type when that is the useful promised result, such as a newly built list.
- Return an abstract interface when a view, interchangeability, or implementation freedom is an intentional API promise.
- Type annotations cannot express every behavioral constraint. Document ordering, consumption, and ownership separately.

## Keep unknown and dynamic values distinct

| Construct | Meaning | Appropriate use |
| --- | --- | --- |
| `object` | An arbitrary value whose specific operations need justification. | Store or pass unknown data; narrow before type-specific work. |
| `Any` | A dynamic escape from ordinary static restrictions. | Contain an untyped dependency or a genuinely dynamic boundary. |
| `cast(T, value)` | Tell the checker to trust that value as `T`. | Express an established invariant the checker cannot infer. No runtime check or conversion occurs. |
| A targeted ignore | Suppress a specific checker finding where supported. | Document a confirmed checker limitation or incorrect dependency stub. |

- Prefer an accurately typed adapter around an untyped dependency over `Any` throughout application code.
- Keep unavoidable `Any` local. Validate or translate its result before returning a precise domain type.
- Do not silence an unexplained error with a cast, blanket ignore, or missing annotation.
- Explain the evidence behind a cast or suppression near its use.
- Checker diagnostic codes differ. Use the project's supported suppression syntax rather than copying another checker's codes.

### Narrow from evidence

- Use `value is None`, `isinstance`, and discriminant checks to establish the relevant case of a union.
- Return or raise after invalid cases so the remaining code operates on a known type.
- Bind a changing attribute or mapping value to a local before narrowing when repeated reads may differ.
- Do not assume `isinstance(values, list)` proves the type of every element.
- A custom boolean predicate does not automatically communicate element checks to a checker.
- Use `TypeGuard` or a version-supported `TypeIs` when a reusable predicate needs that contract.
- Such predicates must perform the promised checks. Incorrect narrowing annotations can manufacture unsafe guarantees.
- Prefer direct checks over elaborate predicates when the predicate has no useful independent role.

## Structural contracts without inheritance

- `Protocol` describes compatible members. An implementation need not inherit from it.
- A member's name, parameter kinds, accepted arguments, and return type participate in compatibility.
- A writable protocol attribute promises both reads and writes. Its type must remain safe in both directions.
- Use a property declaration when the consumer requires only reading an attribute.
- The implementation can satisfy that read-only requirement with a plain public attribute.

```python
from dataclasses import dataclass
from typing import Protocol


class HasTitle(Protocol):
    @property
    def title(self) -> str: ...


@dataclass
class Notice:
    title: str


def heading(value: HasTitle) -> str:
    return value.title.upper()


print(heading(Notice(title="Platform change")))
```

- The protocol declaration specifies an interface; `Notice` supplies the runtime data.
- No forwarding property or inheritance is necessary on `Notice`.
- `@runtime_checkable` permits limited instance checks on a protocol. It does not verify member signatures or value constraints.
- Do not use runtime protocol checks as schema validation or proof that an operation will succeed.
- Read [dependency contract choices](api-design.md#choose-the-dependency-contract) before introducing a protocol or abstract base class.

### Describe keyword-sensitive callbacks accurately

- Simple `Callable[[str], str]` promises a positional argument. It does not describe required keyword names or defaults.
- Use a callback protocol when those details are necessary to the consumer.
- `Callable[..., Result]` leaves argument compatibility unchecked. It does not mean the callback accepts every possible call.

```python
from typing import Protocol


class NoticeRenderer(Protocol):
    def __call__(self, text: str, /, *, uppercase: bool = False) -> str: ...


def render_text(text: str, /, *, uppercase: bool = False) -> str:
    if uppercase:
        return text.upper()
    return text


def render_notice(renderer: NoticeRenderer) -> str:
    return renderer("Boarding now", uppercase=True)


print(render_notice(render_text))
```

- An implementation can choose another positional-only operand name without breaking this contract.
- It must still accept the `uppercase` keyword and the calls that omit that option.
- Use `ParamSpec` when a real wrapper must preserve an arbitrary callable signature.
- Keep a simple explicit signature when the wrapper only supports one known call shape.

## Name types without inventing runtime validation

- An alias gives an existing type a useful name. It does not create a distinct static identity.
- Use aliases to clarify domain vocabulary or a repeated type expression, not to hide a simple type behind indirection.
- `NewType` creates a static distinction when identifiers with the same representation must not be confused.
- Calling a `NewType` returns the original value unchanged. Validate contents separately when the boundary requires it.
- Do not use `isinstance` against a `NewType`; it is not a runtime class for those values.

```python
from collections.abc import Mapping
from typing import NewType

type Headers = Mapping[str, str]
AccountId = NewType("AccountId", str)
InvoiceId = NewType("InvoiceId", str)


def normalized_headers(headers: Headers) -> dict[str, str]:
    return {name.lower(): value for name, value in headers.items()}


def receipt_reference(account: AccountId, invoice: InvoiceId) -> str:
    return f"{account}/{invoice}"


print(normalized_headers({"Content-Type": "text/plain"}))
print(receipt_reference(AccountId("harbor"), InvoiceId("spring-delivery")))
```

- Swapping the identifier arguments is a static error even though both values behave as strings at runtime.
- The `type` statement creates a lazily evaluated annotation alias, not a runtime class or constructor.
- Keep a concrete class for construction and runtime instance checks. An alias is not a validation mechanism.
- Replacing an assignment-based alias can change runtime introspection. Check those consumers during a migration.

## Use generics and overloads for real relationships

- A generic connects types across inputs, outputs, or stored state.
- A type variable used only once usually adds no relationship. Consider a concrete type or `object` instead.
- Start with built-in containers and ordinary functions before introducing generic class hierarchies.

```python
from collections.abc import Sequence


def reversed_copy[Item](values: Sequence[Item]) -> list[Item]:
    return list(reversed(values))


print(reversed_copy(["arrival", "departure"]))
print(reversed_copy((10, 20)))
```

- The type parameter belongs to this function. No module-level `TypeVar` declaration or generic base class is needed.
- The element type flows from the input sequence to the output list.
- This signature does not promise that the output has the same container type as the input.
- Use bounds or constraints only when the implementation requires their operations or relationships.
- Avoid intricate type expressions that obscure a straightforward runtime API.

### Overloads preserve useful caller precision

- Use overloads when supported input cases imply different output types that callers need to know.
- Keep one runtime implementation that accepts and implements every declared case.
- Overloads do not dispatch calls at runtime.
- Prefer a normal union when no meaningful relationship needs separate signatures.

```python
from typing import overload


@overload
def clean_label(value: str) -> str: ...


@overload
def clean_label(value: None) -> None: ...


def clean_label(value: str | None) -> str | None:
    if value is None:
        return None
    return value.strip()


print(clean_label("  West entrance  ").upper())
print(clean_label(None))
```

- A string input produces a string, so the caller need not handle an invented `None` possibility.
- An optional input still produces an optional result. Overloads do not erase a real case.

## Conditional imports and supported versions

- Align syntax, runtime imports, checker configuration, and declared Python support.
- Keep the established checker unless migration is part of the task.
- An import used only by annotations can sometimes move under `if TYPE_CHECKING:`.
- `TYPE_CHECKING` is false at runtime and treated as true by static checkers.
- Current Python defers function and class annotation evaluation by default. Do not add string annotations or future imports by habit.
- Keep runtime-required imports available for base classes, constructors, decorators, default values, and executable type expressions.
- A traditional alias assignment still evaluates its right-hand side, even with future annotations enabled.
- Runtime annotation consumers may also require the referenced names.
- Framework schema generation and `typing.get_type_hints` can resolve annotations and fail if names exist only under `TYPE_CHECKING`.
- Inspect those consumers before changing imports. Exercise the actual schema or introspection path, not just module import.
- Deferred evaluation postpones annotation work; it does not make unavailable names appear.
- If imports form a cycle, first inspect [module dependency direction](api-design.md#keep-modules-cohesive-and-dependencies-directed).

- Preserve an older project's declared support when it requires traditional aliases, `TypeVar`, or forward-reference handling.
- Type parameter syntax and `type` statements require Python 3.12+. Default deferred annotations require Python 3.14+.
- A backport can provide a typing construct. It cannot make an older Python parser accept newer syntax.
- Future annotations still produce stringified annotations. They are not equivalent to the current default evaluation model.
- Check interpreter and checker support when adopting newer typing features, including `TypedDict` openness controls.
- Use version-matched annotation inspection APIs. Do not assume raw `__annotations__` always has the same representation or evaluation behavior.
- Annotation evaluation can execute code. Do not evaluate annotation strings supplied by an untrusted source.

## Sources and contributions

| Guidance here | Source and relevant contribution |
| --- | --- |
| Runtime annotations, aliases, and generics | [Python typing](https://docs.python.org/3.15/library/typing.html) and [type parameter lists](https://docs.python.org/3.15/reference/compound_stmts.html#type-parameter-lists). Define current declarations and their runtime limits. |
| Record behavior and construction | [Python dataclasses](https://docs.python.org/3.15/library/dataclasses.html), especially module contents, post-init processing, frozen instances, and mutable defaults. Defines generated behavior without general field validation. |
| Dictionary shapes and presence | [Typing specification: TypedDict](https://typing.python.org/en/latest/spec/typeddict.html). Defines requiredness, read-only items, openness, and assignability. Check implementation support separately. |
| Annotation scope and input/output choices | [Typing best practices](https://typing.python.org/en/latest/reference/best_practices.html) and [Typing libraries](https://typing.python.org/en/latest/guides/libraries.html), especially wide versus narrow types, generics, overloads, and records. Supplies recommendations, not runtime guarantees. |
| Structural members and read-only attributes | [Typing specification: Protocols](https://typing.python.org/en/latest/spec/protocol.html) and [Protocol reference: Invariance of protocol attributes](https://typing.python.org/en/latest/reference/protocols.html#invariance-of-protocol-attributes). Explains structural compatibility and property-based read contracts. |
| Callback signatures | [Typing specification: Callables](https://typing.python.org/en/latest/spec/callables.html#callback-protocols). Defines callback protocols, keyword compatibility, and the limits of simple `Callable`. |
| Aliases and semantic identifiers | [Typing specification: Type aliases and NewType](https://typing.python.org/en/latest/spec/aliases.html). Separates equivalent names from static distinctions. |
| Dynamic escapes and conditional imports | [Typing specification: Type checker directives](https://typing.python.org/en/latest/spec/directives.html). Defines casts, ignores, and `TYPE_CHECKING`. |
| Reusable narrowing predicates | [Typing specification: Type narrowing](https://typing.python.org/en/latest/spec/narrowing.html). Defines `TypeGuard` and `TypeIs` obligations. |
| Validation, conversion, extra fields, and bypass paths | [Pydantic: Models](https://docs.pydantic.dev/latest/concepts/models/), especially data conversion, extra data, validating data, and construction without validation. |
| Strictness depends on input mode | [Pydantic: Strict mode](https://docs.pydantic.dev/latest/concepts/strict_mode/). Documents Python-versus-JSON differences, including date inputs. |
| Deferred annotations and inspection safety | [Python 3.15: annotationlib](https://docs.python.org/3.15/library/annotationlib.html#annotation-semantics) and [security implications](https://docs.python.org/3.15/library/annotationlib.html#security-implications-of-introspecting-annotations). Defines evaluation modes and code-execution risks. |
