# Types and validation

## Infer implementations, declare important contracts

- Infer obvious local values and callbacks whose surrounding API supplies useful types.
- Annotate function parameters when context does not establish them. Annotate empty collections when their intended contents are not inferable.
- Annotate exported returns when the declared contract should constrain implementation changes or hide incidental detail.
- Preserve inference in schema factories and type-preserving helpers when an annotation would erase useful relationships.
- A local annotation can deliberately widen a mutable variable. A narrower inferred type is not always the desired contract.
- Return annotations for every top-level function are a project preference, not a language requirement.

| Construct | Use | Important limit |
| --- | --- | --- |
| `const value: Contract = expression` | Expose the declared contract and check assignment | Can discard useful expression detail. |
| `expression satisfies Contract` | Check compatibility while retaining useful inferred detail | Contextual typing can still affect inference. |
| `expression as Contract` | Express justified knowledge the checker cannot establish | Does not check or convert runtime input. |
| `expression as const` | Preserve literal values and readonly literal typing | Does not freeze objects at runtime. |
| Non-null assertion, `value!` | Express an established non-null invariant | Adds no check if the invariant is wrong. |

### Example: checked configuration without losing named keys

- Complete module, `routes.ts`:

```ts
interface Route {
  readonly path: string;
  readonly method: "GET" | "POST";
}

export const routes = {
  listJobs: { path: "/jobs", method: "GET" },
  createJob: { path: "/jobs", method: "POST" },
} satisfies Record<string, Route>;

export type RouteName = keyof typeof routes;
```

- The check catches invalid route shapes while `RouteName` retains the declared key set.
- `const routes: Record<string, Route>` instead exposes an open dictionary contract. That fits genuinely dynamic keys.
- `satisfies` does not guarantee unchanged inference. For example, a checked `true` property can remain the literal type `true`.
- Do not add `as const` reflexively. Add it when readonly literal semantics fit the caller's intended use.

## Choose honest object types

- TypeScript generally checks structural compatibility. A value can have more properties than the receiving type names.
- Fresh object literals receive excess-property checks in relevant contexts. This catches likely mistakes, not arbitrary runtime extras.
- Do not move literals through temporary variables or assertions merely to bypass a useful diagnostic.
- `Object.keys` returns runtime keys, not a proof that each key belongs to `keyof T`. Extra runtime properties can exist.
- `Record<string, Value>` describes an indexable dictionary, not proof that every possible key exists at runtime.
- Use `noUncheckedIndexedAccess` to expose unchecked lookup absence. Still handle domain-specific missing cases deliberately.
- An index signature belongs only when arbitrary keys are valid. It is not a general fix for an excess-property error.
- Use an explicit output object or schema when serialization must exclude private or unknown fields.

## Use aliases and interfaces by capability

- Use `type` for unions, tuples, primitives, mapped types, and conditional types.
- Use `interface` for deliberate extension, declaration merging, or augmentation.
- Both describe ordinary object contracts. Preserve the project's consistent default.
- Prefer interface extension for an actual object hierarchy instead of long intersection chains.
- Conflicting intersections can create unusable properties such as `never`. Extension reports incompatible property definitions directly.
- An alias does not create nominal identity. Two structurally compatible aliases remain assignable.

## Match collection types to the operation

- Keep ordinary arrays when empty input has a valid outcome. Require a nonempty tuple only when the operation needs an element.
- Use tuples for fixed grouping, such as `readonly (readonly [T, T])[]` for pairs, rather than a flat array with an even-length comment.
- Complete module, `collections.ts`, contrasting a required first element with ordinary absence:

```ts
export type NonEmpty<T> = readonly [T, ...T[]];

export function first<T>(values: NonEmpty<T>): T {
  return values[0];
}

export function firstOrUndefined<T>(values: readonly T[]): T | undefined {
  return values[0];
}
```

- Validate dynamic tuple length and elements before use. For example, `z.tuple([elementSchema], elementSchema)` establishes a required first slot.
- `NonEmpty<T>` establishes index zero, not every numeric index. Calculated indexing still needs its own justification.
- Readonly tuples prevent direct removal, but mutable aliases can still invalidate their shape. See [ownership and readonly guarantees](values-and-iteration.md).

## Distinguish identifiers through controlled construction

- Use brands when mixing otherwise identical values causes real errors. Reuse the project's convention and validate construction instead of casting.
- Zod 4 boundary fragment: raw IDs are `unknown`; the existing consumer has signature `orderPath(userId: UserId, orderId: OrderId): string`.

```ts
import { z } from "zod";

const UserIdSchema = z.uuid().brand<"UserId">();
const OrderIdSchema = z.uuid().brand<"OrderId">();
type UserId = z.infer<typeof UserIdSchema>;
type OrderId = z.infer<typeof OrderIdSchema>;

const path = orderPath(
  UserIdSchema.parse(rawUserId),
  OrderIdSchema.parse(rawOrderId),
);
```

- Swapping branded IDs fails compilation. Runtime values remain strings; pass their branded types onward without parsing again.
- The boundary must identify the semantic input. UUID syntax alone proves neither entity kind, existence, nor authorization.

## Model related alternatives together

- Use a discriminated union when a tag determines which other fields exist.
- Keep required data on its actual variant. Avoid a record containing optional data, optional error, and unrelated status flags.
- Narrow with checks TypeScript understands: discriminants, `typeof`, `instanceof`, equality, and property checks.
- Prefer explicit nullish checks when empty strings, zero, and false remain valid.
- Exhaustive handling is useful for a closed set of application states. It does not validate unknown protocol messages.
- At external boundaries, validate before entering the closed union. Decide how newer or unknown variants are handled.

### Example: a result whose fields follow its state

- Complete module, `reservation.ts`:

```ts
export type Reservation =
  | { readonly status: "confirmed"; readonly reference: string }
  | { readonly status: "unavailable"; readonly requestedSeats: number }
  | { readonly status: "pending" };

export function describeReservation(reservation: Reservation): string {
  switch (reservation.status) {
    case "confirmed":
      return `Confirmed: ${reservation.reference}`;
    case "unavailable":
      return `Cannot reserve ${reservation.requestedSeats} seats`;
    case "pending":
      return "Reservation pending";
    default: {
      const unexpected: never = reservation;
      throw new Error("Unexpected reservation state", { cause: unexpected });
    }
  }
}
```

- Adding a variant forces this operation to account for it.
- An open protocol registry may need deliberate unknown-message handling instead. Do not force extensible inputs into a falsely closed type.
- String-literal unions suit finite wire values. An `as const` object adds named runtime constants when callers need them.
- Enums remain useful for existing APIs or required runtime behavior. They emit JavaScript and numeric enums provide reverse mappings.
- Avoid exporting ambient `const enum` declarations to consumers. Inlining and separate compilation can disagree across versions.

## Understand narrowing's obligations

- `unknown` accepts arbitrary values but requires checks before use. `any` suppresses checks and can propagate unsafety into other code.
- Keep unavoidable `any` inside a narrow adapter. Expose an honest checked contract outside it.
- A type predicate `value is T` promises both branches: true means `T`, and false excludes `T` in relevant narrowing.
- A check for a small positive number cannot claim `value is number`. Larger numbers would wrongly disappear from the false branch.
- Prefer ordinary inline checks or inferred predicates when they express the condition correctly.
- Assertion functions such as `asserts value is T` require a real runtime check and failure path too.
- The checker does not prove handwritten predicates or assertion functions correct merely because their bodies compile.
- An assertion can be appropriate for a documented foreign API guarantee or a limitation of generic implementation checking.
- Place that assertion at the responsible boundary. Explain the invariant instead of sprinkling casts through callers.

## Distinguish omission, undefined, and null

| Declaration | Contract with `exactOptionalPropertyTypes` |
| --- | --- |
| `label?: string` | The property may be omitted. A present property contains a string. |
| `label: string \| undefined` | The property must be present; its value may be unavailable. |
| `label?: string \| undefined` | Both omission and explicit undefined are allowed. |
| `label: string \| null` | The property is required; null has explicit domain meaning. |

- Reading an optional property still yields possible `undefined`.
- Optional parameters allow omission and explicit `undefined`. They do not share exact optional-property assignment behavior.
- A required parameter typed `T | undefined` still requires an argument.
- Defaulting, patch semantics, membership checks, and serialization can distinguish missing keys from present undefined values.
- Define those semantics at the boundary. Do not replace null with undefined globally when a wire contract uses null.
- Read [values and iteration](values-and-iteration.md) for aliasing, readonly guarantees, copying, and serialization behavior.

## Validate external data once at the responsible boundary

- Treat HTTP bodies, files, environment values, persisted records, and messages as unvalidated until the relevant checks succeed.
- JSON parsing establishes syntax. Assign its result to `unknown` before applying a validator.
- Validate shape and domain constraints. Authorization and legal state transitions still require application logic.
- Prefer a project's existing schema or generated contract. Avoid parallel handwritten types that drift from runtime validation.
- Use direct checks for a genuinely small contract. Use an established schema library for substantial schemas and useful diagnostics.
- Zod is a practical schema-first option, not a mandatory dependency. Keep suitable existing validators.
- Derive the output type when the schema owns the contract. Check schema output against an existing type when that type is authoritative.
- Transforming schemas can have different input and output types. Validate compatibility with the parsed output, not merely the raw input.
- Specify coercion, defaults, unknown-key handling, and error behavior. Silent coercion can change meaningful inputs.
- Pass validated values onward with their concrete types. Revalidate only when trust, lifetime, or mutation changes the contract.
- Follow [antipatterns](antipatterns.md) when reviewing extractor chains, redundant guards, or fallback behavior.

### Example: validate a server response before exposing domain values

- Install the example dependency with `bun add zod`.
- The contract rejects unknown fields, accepts zero stock and false flags, and requires nonnegative safe-integer stock.
- Complete module, `inventory.ts`, for runtimes with Fetch:

```ts
import { z } from "zod";

const InventorySchema = z.array(
  z.strictObject({
    sku: z.string().min(1),
    stock: z.int().nonnegative(),
    active: z.boolean(),
  }),
);

export type Inventory = z.infer<typeof InventorySchema>;

export function parseInventory(value: unknown): Inventory {
  return InventorySchema.parse(value);
}

export async function fetchInventory(
  url: URL,
  signal: AbortSignal,
): Promise<Inventory> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(`Inventory request failed with HTTP ${response.status}`);
  }
  const value: unknown = await response.json();
  return parseInventory(value);
}
```

- Strict unknown-key rejection is this example's contract. A forward-compatible public client may instead strip or retain extra keys deliberately.
- `parse` throws on invalid input. `safeParse` returns a discriminated result when the caller routinely needs validation feedback.
- Use asynchronous parsing when the schema has async refinements or transforms.
- Do not replace validation with `fetchJson<Inventory>()` unless the implementation receives and runs a validator for that type.
- If `Inventory` is independently defined, import it instead of declaring the inferred alias. Annotate `InventorySchema` with `z.ZodType<Inventory>`.
- Incompatible schema output then fails compilation. The check establishes assignability, not exact equality or runtime domain constraints.
- Use `satisfies z.ZodType<Inventory>` when the check must retain concrete schema methods and inferred detail.

## Sources

- [Everyday types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html), [object types](https://www.typescriptlang.org/docs/handbook/2/objects.html), and [narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html): inference, structural compatibility, and union handling.
- [Exact optional properties](https://www.typescriptlang.org/tsconfig/exactOptionalPropertyTypes.html) and [unchecked indexed access](https://www.typescriptlang.org/tsconfig/noUncheckedIndexedAccess.html): presence checks.
- [Effective TypeScript, Item 18](https://github.com/danvk/effective-typescript/blob/main/samples/ch-inference/avoid-inferable.md) and [Item 11](https://github.com/danvk/effective-typescript/blob/main/samples/ch-types/excess-property-checking.md): annotation and object-literal decisions.
- [Total TypeScript on aliases and interfaces](https://www.totaltypescript.com/type-vs-interface-which-should-you-use) and [Google's interface preference](https://google.github.io/styleguide/tsguide.html#prefer-interfaces-over-type-literal-aliases): contrasting project defaults.
- [The satisfies operator](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html#the-satisfies-operator) and [contextual inference example](https://github.com/microsoft/TypeScript/issues/55189): compatibility checks without overpromising unchanged inference.
- [TypeScript 5.5 predicate semantics](https://devblogs.microsoft.com/typescript/announcing-typescript-5-5/#inferred-type-predicates): inferred and explicit predicate obligations.
- [Enum pitfalls](https://www.typescriptlang.org/docs/handbook/enums.html#const-enum-pitfalls): runtime enums and consumer inlining risks.
- [Zod basics](https://zod.dev/basics), [branded types](https://zod.dev/api#branded-types), and [schema APIs](https://zod.dev/api): parsing, controlled branding, tuples, strict objects, and inferred types.
- [TypeScript tuple types](https://www.typescriptlang.org/docs/handbook/2/objects.html#tuple-types) and [readonly tuples](https://www.typescriptlang.org/docs/handbook/2/objects.html#readonly-tuple-types): required positions, rest elements, and read-only access.
- [Pstack TypeScript patterns](https://github.com/cursor/plugins/blob/main/pstack/skills/typescript-best-practices/references/patterns.md): practitioner guidance on collection contracts, branded identifiers, and schema conformance.
