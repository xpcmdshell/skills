---
name: typescript-best-practices
description: >-
  Write idiomatic, readable, reliable TypeScript. Use when writing, reviewing,
  refactoring, debugging, or explaining TypeScript code, including types, generics,
  validation, async work, modules, libraries, services, scripts, and browser code.
  Applies to .ts, .tsx, .mts, .cts, and .d.ts files, and TypeScript project tooling,
  tsconfig.json, Bun workflows, and package exports. Use even when the request does
  not explicitly mention best practices. Covers language engineering, not specific
  frontend framework conventions.
---

# TypeScript best practices

TypeScript checks relationships between JavaScript values before execution. Its types do not validate external data or change JavaScript's runtime behavior. Build around functions, object records, discriminated unions, and cohesive modules. Use classes when state, identity, invariants, or lifecycle justify them.

## Mandatory: read and follow the antipattern rules

- Before writing, reviewing, or refactoring TypeScript, read [antipatterns.md](references/antipatterns.md). These are required quality rules, not optional style advice.
- Reject densely packed expressions, record-extractor chains around known data, redundant validation, and fallbacks that conceal broken contracts.
- Preserve genuine boundary validation and contract-defined recovery. Passing lint does not excuse antipatterns; unsafe assertions do not fix them.

## Start with the project

- Read the relevant implementation, callers, project instructions, manifests, lockfile, compiler configuration, and existing checks.
- Identify the execution host: Bun, Node, a browser, a worker, or a framework-controlled build.
- Separate the TypeScript compiler version, JavaScript runtime minimum, emitted syntax target, and public declaration compatibility.
- Target current stable TypeScript for new work unless the project has an explicit compatibility requirement.
- Confirm releases from [official announcements](https://devblogs.microsoft.com/typescript/) and package metadata before selecting versions.
- Prefer Bun for new projects. This is the setup default, not a claim that TypeScript requires Bun.
- Preserve existing runtimes, package managers, frameworks, and public contracts during unrelated maintenance.
- During modernization, offer concrete compatible versions and explain dependency readiness before changing the support range.
- Fix the requested problem without unrelated style rewrites or new abstraction layers.

## Use the language's ordinary building blocks

- Use functions for transformations and operations without persistent identity. Keep related work in modules named by responsibility.
- Use object records for data. Prefer composition and small behavioral interfaces over inherited class hierarchies.
- Use a class when it owns coherent state or resources. Do not build static utility classes around free functions.
- Use `const` when bindings do not change and `let` when they do. `const` does not freeze objects.
- Use descriptive `camelCase` value names and `PascalCase` type names. Name values for their domain meaning, not incidental implementation steps.
- Write multistep work as a readable sequence. Name intermediate results before using them in a larger expression or object.
- Use braces and multiline bodies for conditionals and loops. Prefer early returns when they remove nesting and keep the main path clear.
- Use a short ternary to select between simple values. Use `if`/`else` when branches contain substantial work or nested choices.
- Use concise arrow bodies for simple expressions; use block bodies for multiple steps. Do not force callbacks into one expression.
- Use `map`, `filter`, `find`, `some`, and `every` for their actual collection operations. A `map` callback can contain ordinary branching.
- Use `for...of` for effects, early exit, or sequential asynchronous work. Avoid dense reductions that hide several operations.
- Build fresh local objects and arrays with assignments or pushes when clearer. Preserve ownership rather than avoiding all mutation.
- Comment on non-obvious intent, constraints, and tradeoffs, not what the syntax already says. Use the project's formatter for mechanical style.
- Use `Map` for dynamic keyed collections and `Set` for membership. Use records for known fields and JSON-shaped contracts.
- Use `??` for missing-value defaults. Use truthiness only when rejecting zero, false, and empty strings is intentional.
- Prefer `===` and `!==`. Distinguish identity comparisons from domain equality.
- Use standard parsers, URL APIs, and maintained libraries instead of custom approximations of existing formats.

## Make types explain the contract

- Infer obvious local values and contextually typed callbacks. Annotate parameters and boundaries where inference hides or destabilizes the contract.
- Give exported operations deliberate return types when they prevent accidental API changes. Preserve useful inference in schema and generic factories.
- Use `type` for unions, tuples, and computed types. Use `interface` for object contracts that need extension or declaration merging.
- Both forms work for ordinary object shapes. Follow local convention instead of rewriting one into the other.
- Represent linked states with discriminated unions, not optional fields whose validity depends on unrelated booleans.
- Narrow with runtime checks and control flow. Use `never` to check exhaustive handling of closed unions.
- Use `unknown` for values not yet established. Confine unavoidable `any` to a justified interoperability boundary.
- Use `satisfies` to check a value against a contract while retaining useful inferred detail. It is not a runtime validator.
- Prefer checked annotations or narrowing over `as` and non-null assertions. Keep necessary assertions local and explain the invariant.
- Use generics to preserve a real relationship between inputs and outputs. Do not build type-level machinery around a concrete operation.
- Prefer readable named types and standard utilities over deeply nested conditional types. Type precision must remain useful to callers.

## Keep runtime guarantees honest

- Validate external data where it enters the system. Parsing JSON establishes syntax, not the expected shape or domain rules.
- Prefer an existing schema library for substantial schemas. Derive static types from the schema when they describe the same contract.
- Treat `readonly` as a restriction through a typed reference. It does not freeze the object or remove mutable aliases.
- Spread, array copies, and copying collection methods preserve references to nested objects.
- Distinguish absent properties, explicit `undefined`, explicit `null`, and valid false-like values.
- Static object types are not exact schemas. Excess-property checks do not seal runtime objects or sanitize serialized output.
- Accept `readonly` inputs when an operation only reads them. State when a result shares objects with its input.

## Own failures, resources, and asynchronous work

- Throw `Error` objects for exceptional failures. Use tagged result values when callers routinely branch on expected domain outcomes.
- Catch where code can recover, translate, or report failure. Preserve causes and avoid converting unrelated failures into apparent absence.
- Every promise needs an owner: await it, return it, or attach deliberate failure handling under an explicit lifecycle.
- `void promise` discards a value. It does not handle rejection. Async callbacks do not become awaited because a callback type returns `void`.
- Use `Promise.all` for independent work whose complete success is required. Rejection does not cancel the remaining work.
- Pass `AbortSignal` into cancellable operations. Cancellation requests stopping; it does not prove remote rollback or local completion.
- Close resources you acquire. Await cleanup and owned tasks before releasing resources they still use.
- Use `using` or `await using` for supported disposable APIs. Use `try/finally` for other cleanup contracts.
- Take concurrency, queue, byte, retry, and time budgets from requirements or explicit configuration, not guessed constants.

## Match modules and tools to execution

- Use ESM for new projects unless deployment or consumer requirements select another format.
- Choose module resolution from the host. A Bun or bundler project and a Node-distributed library need different checks.
- Use `import type` for type-only imports. Keep required side effects explicit rather than relying on erased imports.
- Keep browser, server, and test ambient types in their appropriate compilation environments.
- Enable `strict`. For new projects, also use `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` to expose real presence distinctions.
- Use a project-local compiler, typed ESLint checks, formatting, and behavioral checks. Executing TypeScript without type checking does not establish type correctness.
- Do not assume a new compiler works with tools that import its compiler API. Verify the tool's supported versions.
- Offer suitable modern tooling during setup or modernization. Migrate existing tools only with approval.
- Offer optional cccc cognitive-complexity reporting during tooling setup. Agree on scope, thresholds, and hook or CI enforcement before gating.

## Read the matching references

| Task | Reference |
| --- | --- |
| Model data, narrow unions, annotate code, or validate input | [Types and validation](references/types-and-validation.md) |
| Traverse, group, sort, copy, compare, or retain values | [Values and iteration](references/values-and-iteration.md) |
| Design functions, callbacks, generic APIs, classes, or module boundaries | [API design](references/api-design.md) |
| Handle errors, HTTP, cancellation, concurrent work, or resource cleanup | [Errors, resources, and async](references/errors-resources-and-async.md) |
| Configure module resolution, ship declarations, or publish a library | [Modules and packages](references/modules-and-packages.md) |
| Set up Bun, compiler and lint checks, Git hooks, CI, or upgrades | [Tooling](references/tooling.md) |
| Define behavioral checks, test consumers, or investigate performance | [Verification and performance](references/verification-and-performance.md) |

Read each matching reference before making detailed decisions. Tasks can require several references; unrelated references need not load.

## Before returning work

- Define integration or end-to-end acceptance checks before implementing new features. Test public behavior, not private helper structure.
- Run the project's formatter, type checker, linter, and relevant behavioral checks. With this skill's recipe, run `bun run check`.
- Review fixes rather than hiding findings with blanket suppressions, assertions, or weaker compiler settings.
- Check changed code against [antipatterns.md](references/antipatterns.md). Remove violations before returning work, even when compilation and lint pass.
- Verify failure paths, validation, cleanup, and cancellation where the change affects them.
- For library changes, build and install the packed artifact in a separate consumer. Check declarations and runtime behavior.
- For frontend changes, run the actual browser or framework workflow. Bun tests do not establish browser compatibility.
- Review changed callers, serialization, mutation, error contracts, and supported runtimes.
- Report checks actually run and unresolved issues. Keep work reports out of reusable documentation and comments.

## Evidence

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html) and [TSConfig reference](https://www.typescriptlang.org/tsconfig/) establish language and checker behavior.
- [Effective TypeScript](https://effectivetypescript.com/) and [Total TypeScript](https://www.totaltypescript.com/) supply practitioner reasoning and tradeoffs.
- [Google's TypeScript guide](https://google.github.io/styleguide/tsguide.html) supplies conventions, not universal language requirements.
- [MDN JavaScript documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript) explains runtime behavior that TypeScript preserves.
- Task references link the specific material supporting their decisions and tool recipes.
