# TypeScript antipatterns: mandatory rules

- The user rejects these patterns. Treat violations as defects to fix, not optional cleanup, even when automated checks pass.
- Fix the responsible expression structure, type, or failure contract. Preserve real boundary validation, optional data, and specified recovery.

## Do not pack multistep logic into one expression

- Code must be quick to read, not merely possible to decipher. Treat densely composed expressions as a readability defect.
- Do not nest branching, sorting, mapping, and conditional object construction inside one initializer or argument.
- Separate meaningful steps with descriptive local variables. Use ordinary `if` statements and block-bodied callbacks for multistep work.
- Compute transformed collections before constructing the object that contains them. Keep the final object easy to scan.
- Replace repeated conditional spreads with explicit assignments when the spreads obscure field construction.
- Extract a cohesive operation when its name makes the caller clearer. Simplify its body rather than hiding the same dense expression.
- Do not create a helper for every expression or invent generic builders to avoid straightforward statements.
- Short expressions and simple chains remain useful. Split them when readers must mentally unpack several operations to understand the result.
- Formatting, successful type checks, and low cognitive-complexity scores do not establish readability. Review the expression structure directly.

## Preserve concrete types after validation

- Validate genuinely unknown input at its entry boundary. Pass the resulting concrete type into ordinary application code.
- Do not widen known values to `unknown`, `object`, or `Record<string, unknown>` merely to pass them through defensive helpers.
- Do not reconstruct known fields through `asRecord`, `getString`, `asBoolean`, or similar extractor chains.
- Fix missing SDK generics, schema inference, function signatures, or database types at their source instead.
- Do not add repeated `typeof`, null, array, or `instanceof` checks for properties already established by that contract.
- A concrete type is usable only when its source honors the contract. A cast on raw JSON does not establish that contract.
- If an upstream declaration is wrong, correct or isolate it. Do not spread its uncertainty across every consumer.
- Keep an honest narrow adapter for an actual foreign API limitation. Do not replace one justified assertion with fake validation.
- Generic object guards remain legitimate inside real parsers and genuinely dynamic-data APIs. Their names are not the defect.

## Do not turn invalid state into ordinary empty values

- Required data must remain required. Reject malformed input instead of substituting `""`, `{}`, `[]`, zero, or false.
- Do not hide a missing required object with optional chaining or a fallback. Fix the violated contract or report the failure.
- Do not coerce arbitrary values to satisfy a domain type. `String(undefined)`, `Number("")`, and `Boolean("false")` can conceal invalid input.
- Keep normalization the domain actually defines, such as trimming a supplied name. Normalization is not permission to accept unrelated types.
- Do not silently discard invalid records with `filter(Boolean)`, catch-and-continue loops, or early returns.
- A best-effort batch must expose skipped or failed items through its result or owning reporting boundary.
- Do not broaden inputs or make fields optional merely to avoid fixing a caller or handling a compiler error.
- Do not use `as unknown as T`, `any`, or non-null assertions to conceal the same contract failure in a different form.
- Defaults belong to genuinely optional choices. Absence, malformed data, and failed operations are different states.

### Example: replace record extraction with a validated domain value

- Avoid this implementation when project data has a known application schema.
- This complete negative example accepts malformed required data and manufactures a success-shaped label:

```ts
function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function textOrEmpty(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  return "";
}

export function projectLabel(value: unknown): string {
  const project = asRecord(value);
  const owner = asRecord(project.owner);
  return `${textOrEmpty(project.name)} (${textOrEmpty(owner.name)})`;
}
```

- The object guard establishes neither the required fields nor their domain validity.
- Returning a record keeps every property unknown. The extractors then suppress the failures that would reveal a broken producer.
- Do not repair this by asserting `value as Project`. Validate raw input or retain the concrete type already supplied upstream.
- Complete positive module, `project-label.ts`, with Zod installed through `bun add zod`:

```ts
import { z } from "zod";

const ProjectSchema = z.strictObject({
  name: z.string().trim().min(1),
  owner: z.strictObject({
    name: z.string().trim().min(1),
  }),
});

export type Project = z.infer<typeof ProjectSchema>;

export function parseProject(value: unknown): Project {
  return ProjectSchema.parse(value);
}

export function projectLabel(project: Project): string {
  return `${project.name} (${project.owner.name})`;
}
```

- An HTTP or file boundary parses once with `parseProject`, then passes the returned value to `projectLabel`.
- A caller with an already-established `Project` calls `projectLabel` directly. Do not add another parse merely to follow the example mechanically.
- Strict unknown-key rejection and trimming are this example's input policy. Preserve the actual application's schema and normalization contract.
- `parse` reports invalid input by throwing. `safeParse` is equally appropriate when the boundary explicitly handles its failure result.
- Returning an empty label on `safeParse` failure would recreate the original bug despite using a schema library.

## Propagate errors unless recovery satisfies the contract

- Logging is not recovery. A logged database failure followed by `[]` tells callers that the query succeeded with no rows.
- Recover only specified failure categories. An optional-file loader may accept a confirmed missing file, not every read or parse failure.
- Propagate unexpected failures to the owning request, job, or command boundary. Fail that operation without terminating unrelated work.
- Stale-cache fallback or best-effort processing needs an explicit feature contract and observable failure reporting.
- Read [errors, resources, and async](errors-resources-and-async.md) for error translation, reporting, cleanup, and task ownership.

## Use linting for properties it can establish

- Use the bundled rules through the [typed-linting recipe](tooling.md#configure-typed-linting-and-formatting) for redundant conditions, conversions, and assertions.
- A helper accepting `unknown` makes its internal checks necessary to the checker, even when callers discarded useful types.
- Lint cannot reliably detect that whole design, judge recovery policy, or establish readability. Review those properties directly.
- Do not approximate that judgment with blanket bans on records, casts, guards, or defaults.
- Check diagnostics against the runtime contract. Never remove required validation or weaken behavioral assertions merely to satisfy typed lint.

## Review structure, data flow, and failures

- Can a reader follow the operation's steps directly, without unpacking nested transformations, branches, and object construction?
- Do intermediate names and helpers clarify meaningful steps, or merely relocate dense expressions and fragment coherent work?
- Does genuinely unknown input become a concrete type that remains intact through its consumers?
- Does each fallback, catch, or skipped record represent a permitted outcome rather than conceal a broken contract?
- Does malformed required input produce an observable failure rather than a successful empty result?

## Sources

- [TypeScript Anti-Slop, by pipethedev](https://gist.github.com/pipethedev/ff13d98a5b626f985708afb343723048): practitioner examples of record-extractor proliferation, unnecessary widening, and hidden failures.
- [TypeScript discussion of LLM-generated runtime checks](https://www.reddit.com/r/typescript/comments/1ngkkwe/llms_ai_are_a_hassle_to_use_with_typescript): practitioner reports of repetitive defensive checking, not measured prevalence.
- [typescript-eslint no-unnecessary-condition](https://typescript-eslint.io/rules/no-unnecessary-condition/): predicate checking, indexed-access caveats, and limits of type-based diagnostics.
- [typescript-eslint no-unnecessary-type-conversion](https://typescript-eslint.io/rules/no-unnecessary-type-conversion/) and [no-unnecessary-type-assertion](https://typescript-eslint.io/rules/no-unnecessary-type-assertion/): redundant conversions and casts.
- [ESLint no-empty](https://eslint.org/docs/latest/rules/no-empty) and [no-useless-catch](https://eslint.org/docs/latest/rules/no-useless-catch): existing catch-related checks and their scope.
- [Zod basics](https://zod.dev/basics): validation results and schema-derived types.
