---
name: go-best-practices
description: >-
  Write idiomatic, readable, reliable Go. Use when writing, reviewing, refactoring,
  debugging, or explaining Go or Golang code: packages, functions, methods,
  interfaces, generics, errors, goroutines, channels, context, synchronization,
  I/O, HTTP, SQL, CLIs, modules, go.mod, tests, benchmarks, and profiling.
  Applies to .go files and Go projects even when the request does not explicitly
  mention best practices or code quality.
---

# Go best practices

Write Go whose callers can understand its values, effects, failures, and resource lifetimes. Use the language and standard library directly. Design around Go's packages, values, and behavior contracts, not a class hierarchy translated from another language. Add abstractions where they contain real complexity.

## Start with the task and the current language

- For new projects, default to the latest stable Go release and its current features unless another target is requested.
- This guide uses Go 1.27 language and library facilities. Confirm the current release from [Go downloads](https://go.dev/dl/).
- Do not choose older syntax merely because the local toolchain is old or an older guide uses it.
- Read the relevant implementation, callers, project instructions, `go.mod`, `go.work`, build tags, and verification commands.
- Keep useful existing tools. A preferred linter or directory layout is not a reason for an unrelated migration.
- Identify required public behavior, compatibility commitments, deployment constraints, and failure handling before changing contracts.
- Follow explicitly requested compatibility requirements without inventing legacy support, deprecated wrappers, or staged migrations.
- During version upgrades or broader modernization, offer [concrete Go targets](references/modules-and-tooling.md#choose-the-version-upgrade-target), such as a supported conservative release or the latest stable release.
- Distinguish upgrading the working compiler from raising the module's required Go version. Existing directives do not require retaining the old minimum during an authorized upgrade.
- If the target is unspecified, explain dependency and deployment readiness, recommend a target, and ask. If already specified, implement it without asking again.
- Preserve compatibility during unrelated maintenance. Once a higher minimum is approved, align code, module requirements, checks, and CI with it.
- Ask about material ambiguity. Discover toolchain and repository facts yourself.

| Work | Design emphasis |
| --- | --- |
| Small command | Direct control flow, useful diagnostics, and correct process status. |
| Application or service | Cohesive packages, explicit dependencies, resource ownership, and shutdown. |
| Reusable library | A deliberate exported surface, stable semantics, useful errors, and real consumer builds. |
| Maintenance | Preserve promised behavior unless the request changes it. Keep the change local to the responsible boundary. |

## Use Go's ordinary building blocks well

- Start with functions, structs, slices, maps, and cohesive packages.
- Use a method when behavior belongs to its receiver. Use a package function when no receiver helps; the package supplies a namespace.
- Use an interface for behavior the consumer actually needs, not a mirror of every concrete method.
- Accept existing interfaces such as `io.Reader` when their contracts fit. Do not recreate them with project-specific names.
- Use generics for a real relationship between types and operations. Do not replace ordinary concrete code with unnecessary type machinery.
- Make zero values useful where that fits the domain. Use constructors when successful creation needs validation, dependencies, or resources.
- Keep fields private when callers must not break invariants. Export plain data when direct construction and mutation are intended.
- Place complexity inside the responsible package. Avoid making each caller repeat validation, locking, cleanup, or error translation.
- Before adding a service wrapper, interface, or middleware layer, identify the state, invariant, or consumer operation it serves.
- When these boundaries matter, read [Packages and APIs](references/packages-and-apis.md#choose-the-smallest-mechanism-that-expresses-the-contract) for functions, concrete types, callbacks, and established protocols.

## Choose everyday collection and text idioms

- For filtering or an unknown result count, start with `var result []T` and keep each `append` result.
- For one result at every known position, use `make([]T, n)` and assign by index.
- To reserve append space without adding elements, use `make([]T, 0, n)` when a useful size estimate justifies it.
- Preserve nil-versus-empty and aliasing contracts when changing construction. Read [slice construction](references/values-and-types.md#build-slices-from-the-result-shape).
- Use `+` for a few strings, `fmt.Sprintf` for formatting, and `strings.Join` for collected parts with separators.
- Use `strings.Builder` for repeated string assembly. Use an `io.Writer` for output or `bytes.Buffer` for byte-oriented buffering.
- Choose from the result and destination, not a blanket speed rule. Read [text construction](references/values-and-types.md#choose-text-construction-from-the-result-and-destination) for examples and ownership limits.

## Make control flow and names easy to follow

- Run `gofmt`. Use Go's established `MixedCaps` names and consistent initialisms such as `HTTPClient` and `userID`.
- Choose package names that make qualified calls clear. Prefer `report.Parse` over repeated or vague names such as `report.ParseReport` or `util.Process`.
- Use descriptive domain names. Conventional local names such as `err`, `ctx`, and `ok` work when their scope makes them clear.
- Handle errors and early exits near the operation. After an unconditional return or continue, omit an unnecessary `else`.
- Use an `if` or `switch` initializer for a value needed only inside that statement. Declare it before the guard when later work needs it.
- Use a value switch for alternatives of one value, or an expressionless switch for ordered conditions. Keep a simple two-way choice as an `if`.
- Read [ordinary branching](references/packages-and-apis.md#keep-ordinary-branching-local) for scope, fallback behavior, and a unit-selection example.
- Distinguish declaration from assignment. Review `:=` carefully when shadowing changes which error, resource, or state is updated.
- Use a boolean for a genuine yes/no choice. Use a named type, options value, or separate operation when callers face distinct policies.
- Avoid custom framework layers, configuration builders, option systems, and wrapper types without an actual need.
- Use established parsers and protocol libraries rather than handwritten approximations.

## Make hidden contracts explicit

- Assignment copies a value, not every object reachable through it. Slices, maps, pointers, and interfaces can preserve aliases.
- State whether inputs are borrowed, mutated, retained, consumed once, or copied into independent storage.
- Distinguish absent values, valid zero values, nil interfaces, and interfaces containing typed nil pointers.
- Define whether partial results remain valid on error and whether ordering is part of the result contract.
- An exported type or method can make representation, concurrency, and error behavior part of an API commitment.
- Validate external data at its boundary. Static types and successful JSON decoding do not establish domain validity.
- Default new JSON work to current `encoding/json/v2` facilities. Treat existing wire-format semantics as an explicit contract during migration.

## Own failure, resources, and concurrent work

- Return expected operational failures as errors. Add useful operation context without exposing secrets or private implementation contracts.
- Use `errors.Is` for conditions and `errors.AsType` for typed error extraction. Do not classify failures by message text.
- Close resources you own, not resources you borrow. Place cleanup beside successful acquisition and check completion errors that affect the result.
- Distinguish writing into a buffer, flushing, closing, and committing durable effects.
- Give every goroutine an owner, a stopping mechanism, a completion signal, and an error destination.
- Pass request context through dependent work. Cancellation signals stopping; it does not prove goroutines, remote effects, or cleanup have finished.
- Prefer `sync.WaitGroup.Go` for completion-only task groups and `errgroup` when coordinated task errors and cancellation fit.
- Choose channels or locks from the state and synchronization contract, not from a slogan.
- Take concurrency, queue, byte, retry, and time budgets from caller requirements or explicit configuration. Do not invent operational limits.

## Configure checks at the three boundaries

- For new projects, use the [check, commit-hook, and CI recipe](references/modules-and-tooling.md#configure-checks-commit-hooks-and-ci).
- Use Go's native build, vet, and test commands, goimports, Staticcheck, errcheck, govulncheck, and prek.
- During tooling setup, offer [cccc cognitive-complexity checks](references/modules-and-tooling.md#offer-cccc-during-tooling-setup) with a suggested maximum of 15 per function.
- Confirm whether to enable cccc in commit hooks, CI, or both. Preserve existing policy and do not silently omit the offer.
- Keep suitable existing check commands and analyzer runners instead of adding a competing workflow.
- Declare Go tool dependencies in the project. Install the commit hook in each clone and run the same configuration in CI.
- Agent instructions require checks before returning work. Hooks run them at commit time; CI catches missing or bypassed hooks.

## Load the relevant references

Read each matching reference before making detailed decisions in its area.

| Task | Reference |
| --- | --- |
| Organize packages, simplify branching, or design functions, methods, interfaces, or generic APIs | [Packages and APIs](references/packages-and-apis.md): native boundaries, ordinary control flow, construction, method sets, contracts, and documentation. |
| Construct collections or text, or change representation, copying, nil handling, equality, or iteration | [Values and types](references/values-and-types.md): result construction, aliasing, presence, current type mechanisms, and iterator lifetime. |
| Handle errors, files, streams, parsing, HTTP, SQL, or subprocesses | [Errors and I/O](references/errors-and-io.md): inspectable failures, resource ownership, partial progress, and external effects. |
| Add goroutines, cancellation, channels, locks, or parallel work | [Concurrency and context](references/concurrency-and-context.md): task lifetime, synchronization, admission, stopping, and joining. |
| Create modules, configure tools, Git hooks, or CI, manage dependencies, or ship a command or library | [Modules and tooling](references/modules-and-tooling.md): current toolchains, module boundaries, reproducible setup, and consumer artifacts. |
| Define verification, investigate concurrency failures, or optimize performance | [Testing and performance](references/testing-and-performance.md): public integration checks, diagnostics, race detection, fuzzing, and measurement. |

## Before returning work

- Define integration or end-to-end acceptance checks before implementing a new feature.
- Exercise observable behavior, important failures, resource cleanup, and real external boundaries, not private implementation structure.
- Run the project's shared checks before returning changed Go code. With the recipe configured, run `prek run --all-files`.
- Include new files in the formatter's selected inputs. Review its changes and rerun the checks before committing.
- Run applicable build, integration, and race checks too. Investigate findings instead of broadly suppressing them.
- For library changes, compile and exercise a separate consumer. For commands, run the built artifact outside the checkout.
- For concurrency changes, observe actual stopping and joining rather than only receiving cancellation or seeing no race report.
- For performance changes, compare equivalent workloads and preserve result and resource contracts.
- Review changed callers, exported behavior, ownership, and dependency effects.
- Report checks actually run and unresolved issues. Keep verification reports out of reusable documentation and code comments.

## Sources

- [Go specification](https://go.dev/ref/spec), [standard library](https://pkg.go.dev/std), and [memory model](https://go.dev/ref/mem): language and runtime contracts.
- [Go 1.27 release notes](https://go.dev/doc/go1.27): current language, library, and tooling changes.
- [Effective Go](https://go.dev/doc/effective_go) and [Go Code Review Comments](https://go.dev/wiki/CodeReviewComments): established reasoning and conventions.
- [Go modules reference](https://go.dev/ref/mod), [toolchains](https://go.dev/doc/toolchain), and [diagnostics](https://go.dev/doc/diagnostics): build and operational behavior.
- The task references cite specific contracts and practitioner guidance. Current specifications and package documentation resolve outdated advice.
