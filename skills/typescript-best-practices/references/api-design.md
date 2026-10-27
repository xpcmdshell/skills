# API design

## Keep the boundary smaller than its implementation

- Organize modules around responsibilities such as inventory, authentication, or storage, not miscellaneous `utils` or `types` collections.
- Keep state and invariants with the module that owns them. Expose operations that callers can use without coordinating private steps.
- Use free functions for stateless operations and ordinary objects for passive data.
- Use a closure for simple private state and a class when instance identity, controlled operations, lifecycle, or framework integration fits.
- A class does not need an interface automatically. Add an interface for an actual consumer contract or interchangeable implementation.
- Prefer composition when one component uses another. Use inheritance for a real substitutable relationship or a required framework contract.
- Do not export implementation helpers solely because tests want to call them.
- Expose package entry points deliberately. Internal re-export chains can hide dependencies and introduce cycles or accidental side effects.
- Named exports often make internal code easier to locate. Default exports remain valid when a framework or established API expects them.
- Use namespaces for declaration modeling or an actual compatibility requirement, not as a substitute for ordinary modules.

## Design calls that expose meaningful choices

- Keep required inputs direct. Use an options object when several choices, optional values, or same-shaped arguments need names.
- A boolean remains appropriate for a genuine two-state choice. `{ overwrite: true }` communicates more than an unexplained positional `true`.
- Use a literal union when callers choose distinct modes, such as `"create" | "replace" | "merge"`.
- Use a discriminated options union when one mode requires additional fields. Avoid options whose validity relies on comments alone.
- Prefer a named result object when callers need several independently meaningful outputs. A tuple fits a conventional fixed relationship.
- Accept the operations you actually require: `Iterable<T>` for traversal, `readonly T[]` for indexed reading, or a small callback contract.
- Broader inputs can change error timing or consumption. Do not accept one-shot iterators while promising replay.
- State whether arguments are mutated, retained, consumed, or copied. A type annotation cannot establish ownership.
- Handle defaulting at one responsible boundary. Avoid hidden environment reads inside otherwise reusable operations.

## Use generics to preserve relationships

- Introduce a type parameter when the result or another argument depends on the caller's input type.
- Keep constraints limited to operations the implementation actually uses.
- Prefer a direct type parameter to a parameter constrained to an unnecessarily complicated container type.
- The rule that a parameter should appear twice is a design heuristic. Inferred return types and class-level relationships count.
- Do not write a return-only parser generic that lets callers choose an unchecked result type.
- Use `unknown` when the implementation accepts an arbitrary value but returns no related type information.
- Prefer union parameters when alternatives share the same return contract.
- Use overloads when distinct valid call forms have different useful output contracts. Include supported union-valued calls deliberately.
- An implementation signature is not an additional public overload.

### Example: preserve selected values without a collection framework

- Complete module, `index-by.ts`:

```ts
export function indexBy<Value, Key>(
  values: Iterable<Value>,
  keyOf: (value: Value) => Key,
): Map<Key, Value> {
  const indexed = new Map<Key, Value>();
  for (const value of values) {
    indexed.set(keyOf(value), value);
  }
  return indexed;
}
```

- `Value` preserves the caller's element type. `Key` links the callback result to the map's keys.
- Duplicate keys replace earlier values. Document or change that policy if duplicates indicate an error.
- The map retains the supplied values, not copies. Object keys use identity.
- A one-off index with a fixed domain can use a local loop instead. The generic helper earns its place through actual reuse.

## Derive types without hiding the domain

- Use `Pick`, `Omit`, `Partial`, `Required`, `Readonly`, and `Record` when they express a real relationship clearly.
- Do not use `Partial<Domain>` as every create or patch input. Required fields and explicit deletion semantics often differ.
- Derive implementation-adjacent types with `typeof`, `keyof`, `ReturnType`, and `Awaited` when one source of truth prevents drift.
- Keep independent public contracts explicit when deriving from implementation would expose accidental changes.
- Name intermediate types when a type expression becomes difficult to interpret.
- Conditional and mapped types can improve public APIs. Use them when callers gain useful inference or correctness, not merely clever compression.
- A conditional with a naked type parameter distributes over unions. `[T] extends [U]` tests the union together instead.
- Conditional inference from an overloaded function uses the last signature, not argument-specific overload resolution.
- Avoid recursive type machinery when a readable explicit shape already states the contract.
- Measure checker performance before refactoring types for speed. Difficult diagnostics and fragile inference are design costs too.

## Treat callbacks as executable contracts

- Annotate callback inputs when their implementation lacks contextual typing. Do not repeat types already supplied by a well-typed API.
- An optional callback parameter means the caller of that callback may omit it.
- A callback consumer can ignore supplied arguments without making those arguments optional in the callback type.
- A callback type returning `void` means its result is ignored. It does not guarantee that implementations return no value.
- Async functions can satisfy some void callback types. Use `Promise<void>` when the operation must await completion.
- When an API deliberately accepts synchronous or asynchronous completion, specify `void | Promise<void>` and await the result.
- Prefer a function-valued property when a behavioral interface needs strict callback parameter variance. Method syntax has a bivariance exception.
- Avoid `Function` as a callback type. Describe its actual parameters and result.
- Unbound methods can lose their receiver. Pass a closure, bind the receiver, or use an arrow field when that ownership fits.
- Arrow fields allocate a function per instance. Do not convert every method into one when no binding problem exists.

## Keep class invariants real

- Initialize required fields during construction. Use a factory when creation requires asynchronous work or validated input.
- A definite-assignment assertion suppresses a check. Use it only when an external lifecycle really establishes initialization.
- `implements` checks compatibility but does not supply missing parameter annotations or create runtime validation.
- TypeScript `private` and `protected` restrict checked access. JavaScript `#private` fields enforce runtime privacy.
- Use runtime privacy when callers must not access the representation. It is not a substitute for process or security boundaries.
- Use getters for meaningful derived or controlled access, not automatic getter/setter pairs around every property.
- Classes deserialized from JSON are plain objects unless explicitly reconstructed. A cast does not restore prototypes or private fields.
- Decorators require the selected framework and compiler pipeline's semantics. Standard decorators and legacy experimental decorators differ.
- Do not enable legacy metadata or create a dependency-injection framework for ordinary composition without a concrete need.

## Document what signatures cannot say

- Document public effects, failures, ordering, mutation, retention, cancellation, and required units.
- Explain whether failure leaves partial effects or usable partial results.
- Use TSDoc or the project's established JSDoc style. Do not duplicate parameter types in prose when the signature already states them.
- Give examples for operations whose valid use is not obvious. Keep examples executable under stated prerequisites.
- Explain non-obvious assertions and compatibility constraints beside the responsible code.
- Preserve property names, argument optionality, overloads, generic relationships, error behavior, and runtime exports during unrelated refactoring.
- Declaration-only changes can break TypeScript consumers even when emitted JavaScript is unchanged.
- Read [modules and packages](modules-and-packages.md) before changing public entry points or distributing these types.

## Sources

- [TypeScript function guidance](https://www.typescriptlang.org/docs/handbook/2/functions.html): generics, overloads, optional callbacks, and void return assignability.
- [Effective TypeScript's Golden Rule of Generics](https://effectivetypescript.com/2020/08/12/generics-golden-rule/): useful relationships and return-only generic hazards.
- [Conditional types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html): distribution and overload inference.
- [TypeScript classes](https://www.typescriptlang.org/docs/handbook/2/classes.html): initialization, privacy, receiver binding, and structural compatibility.
- [Google container-class guidance](https://google.github.io/styleguide/tsguide.html#container-classes): functions and modules instead of static utility classes.
- [Strict function types](https://www.typescriptlang.org/tsconfig/strictFunctionTypes.html): function parameter checks and the method exception.
- [Total TypeScript on return annotations](https://www.totaltypescript.com/should-you-declare-return-types): deliberate boundary contracts as a practitioner preference.
