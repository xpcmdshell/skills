---
name: python-best-practices
description: >-
  Write idiomatic, readable, reliable Python. Use when writing, reviewing, refactoring,
  debugging, or explaining Python code, including functions, classes, modules, type
  annotations, exceptions, files, iterators, async tasks, tests, CLIs, libraries,
  dependencies, and pyproject.toml. Applies to Python projects and .py or .pyi files,
  even when the request does not explicitly mention best practices or code quality.
---

# Python best practices

Write Python around functions, ordinary objects, iterable values, and cohesive modules. Use its standard protocols and library operations directly. Choose representations and interfaces that fit the work, rather than translating another language's class hierarchy or collection pipeline. Keep callers' inputs, results, state changes, and failures clear.

## Start with the project and the task

- Read the relevant implementation and its callers before choosing a new interface.
- Inspect project instructions, supported Python versions, dependency configuration, type-checker settings, and existing verification commands.
- Use the project’s environment and tools until the user approves a change. Offer suitable modern, mature replacements for older tooling.
- For new projects, target the latest stable Python release unless the user requests another version or compatibility range.
- Confirm the release from [Python’s downloads](https://www.python.org/downloads/), not just the installed interpreter.
- During version upgrades or broader modernization, offer [concrete Python targets](references/packaging-and-tooling.md#choose-supported-python-versions-deliberately), including a supported conservative release and the latest stable release where viable.
- Distinguish the development interpreter from the minimum supported Python version. Existing metadata is the starting point, not an instruction to retain old support during an authorized upgrade.
- If the target is unspecified, explain dependency readiness and migration costs, recommend a target, and ask. If already specified, implement it without asking again.
- Preserve compatibility during unrelated maintenance. Once a higher minimum is approved, align code, metadata, checks, and CI with it.
- Establish the requested behavior, including failure cases and compatibility commitments. Ask about material ambiguity; discover project facts yourself.
- Fix the requested problem completely without turning a local change into an unrelated architecture or style rewrite.

| Work | Design emphasis |
| --- | --- |
| Local script | Direct control flow and useful failures. Add packaging or abstractions when the script’s actual use needs them. |
| Application | Cohesive modules, explicit configuration, owned resources, and clear boundaries around external systems. |
| Reusable library | Deliberate public interfaces, useful type information, documented effects and errors, and installed-package behavior. |
| Maintenance | Preserve promised behavior and supported callers. Change contracts deliberately when the task requires it. |

## Use Python’s existing building blocks

- Start with functions, ordinary modules, and built-in collections when they express the operation clearly.
- Use a class when state, invariants, or a resource lifecycle belongs together. Avoid classes that only rename a function.
- Accept a function or other callable for a simple callback. Add a custom protocol when consumers need an actual behavioral interface.
- Reuse standard iteration, context management, comparison, and collection protocols rather than designing parallel method families.
- Use public attributes for ordinary data and properties for appropriate derived or controlled values, not routine getter/setter pairs.
- Use a dataclass for an attribute-based record when its generated behavior fits. Keep dictionaries for actual mapping-shaped contracts.
- Name things by their domain role. Follow the surrounding project’s conventions.
- Standard Python naming uses `snake_case` for functions and variables, `CapWords` for classes, and `UPPER_CASE` for constants.
- Use established parsers and libraries for existing formats and protocols. A short handwritten parser is not automatically simpler to maintain.
- Put implementation complexity inside the responsible module instead of requiring every caller to coordinate its details.

## Express everyday operations directly

- Iterate values directly. Use `enumerate` for position and value, `.items()` for keys and values, and unpacking for meaningful field names.
- Pair inputs with `zip`; use `strict=True` when equal lengths are required, not when truncation is intentional.
- Use comprehensions for straightforward transformations and filters. Use loops for several actions, distinct failures, or complex decisions.
- Use `any` or `all` for short-circuiting questions, not work that must process every item.
- Use `Counter` for counts and `defaultdict` for automatic grouping when those semantics fit. Avoid custom collection wrappers without added behavior.
- Use `sorted(..., key=...)` for a new ordered list; use `.sort()` for deliberate in-place reordering.
- Use f-strings to format values and `str.join` to assemble strings. Do not build a string-builder class around ordinary formatting.
- Prefer readable conditions and early returns. Dense expressions and chains of trivial helpers do not make code more idiomatic.
- Read [state and iteration](references/state-and-iteration.md#traverse-values-and-unpack-records) for examples, alternatives, ordering, and consumption details.
- Read [API design](references/api-design.md#choose-a-function-or-an-object) when a wrapper, class, callback, or protocol seems necessary.

## Make contracts visible

- Choose arguments from the operations the function needs, not from the first caller’s concrete type.
- Use meaningful keyword-only options. `overwrite=False` is clear; an actual multi-mode policy may need an enum or `Literal`.
- Return useful, honest result types. Do not turn a list into a generator without considering replay, error timing, and resource lifetime.
- Distinguish missing data, `None`, and valid false-like values such as zero or an empty collection.
- State whether an operation mutates supplied objects, returns shared state, or creates independent values.
- Annotate public interfaces and meaningful data relationships. Keep annotations readable and let obvious local values infer.
- Treat external input as untrusted until the relevant shape and domain constraints are checked. An annotation or cast does not validate it.
- Document behavior that names and signatures cannot express: ownership, consumption, ordering, side effects, and actionable failures.

## Own resources and failures

- Keep acquisition and cleanup with an identifiable owner. Use context managers for scoped resources.
- A function normally closes resources it opens, not resources it borrows from its caller.
- Catch an exception where code can recover, translate it meaningfully, or report the operation’s failure.
- Keep protected operations narrow. Do not convert unrelated programming failures into missing data or apparent success.
- Preserve causes when adding domain context. Do not expose secrets in error messages, logs, or generated representations.
- Treat task completion, cancellation, and worker termination as different events. Cleanup follows actual resource use.
- Choose resource capacities and deadlines from application requirements or explicit configuration, not unexplained constants.

## Standard tooling

Use this stack for new projects. Offer suitable upgrades in existing projects, but migrate only with the user's consent.

| Tool | Responsibility |
| --- | --- |
| uv | Python versions, project environments, dependencies, lockfiles, and command execution. |
| Ruff | Formatting and linting. |
| ty | Static type checking in the project environment. |
| pytest | Integration and end-to-end verification. |
| prek | Git hooks, using the official `ruff-pre-commit` hooks and a project-wide ty check. |
| uv_build | Building supported pure-Python packages. Use another backend when build requirements need it. |

- If you find Hatchling, identify it and offer migration to `uv_build` when the package's build requirements fit.
- Follow the [migration-offer guidance](references/packaging-and-tooling.md#offer-tooling-upgrades-without-migrating-unasked). Explain benefits and constraints, then wait for approval before changing tooling.
- Declare development tools in the project and commit its `uv.lock`.
- Keep the Ruff hook revision aligned with the project’s Ruff version.
- Use the [setup and hook recipes](references/packaging-and-tooling.md) for scripts, applications, packages, and CI.
- During tooling setup, offer [cccc cognitive-complexity checks](references/packaging-and-tooling.md#offer-cccc-during-tooling-setup) with a suggested maximum of 15 per function.
- Confirm whether to enable cccc in commit hooks, CI, or both. Preserve existing policy and do not silently omit the offer.

## Read the relevant references

Read the matching reference before making detailed decisions in that area. Load multiple references when the task spans their responsibilities.

| Task | Reference and purpose |
| --- | --- |
| Design functions, classes, modules, or a public API | [API design](references/api-design.md): choose interfaces, organize responsibilities, and preserve contracts. |
| Add types, model records, or validate input | [Types and validation](references/types-and-validation.md): choose representations and distinguish static checking from runtime guarantees. |
| Traverse, group, sort, or format data; change shared state, iteration, or caching | [State and iteration](references/state-and-iteration.md): choose direct idioms and preserve ordering, aliasing, consumption, and deferred work. |
| Handle errors, files, clients, transactions, or process boundaries | [Errors and resources](references/errors-and-resources.md): place failure boundaries and own cleanup and external effects. |
| Introduce or change concurrent work | [Concurrency](references/concurrency.md): choose execution, task lifetime, failure, cancellation, and admission policies. |
| Create or change project setup, dependencies, Git hooks, CI, or distributions | [Packaging and tooling](references/packaging-and-tooling.md): configure useful checks and verify installed artifacts. |
| Design tests or change performance-sensitive behavior | [Verification and performance](references/verification-and-performance.md): exercise public behavior and investigate measured costs. |

## Before returning work

- Run the project’s applicable formatting, linting, type-checking, and behavior checks. Resolve findings rather than broadly suppressing them.
- For new features, define integration or end-to-end acceptance checks before implementation. Test observable behavior, not private implementation structure.
- Exercise the relevant failure, cleanup, and boundary behavior, not only the successful path.
- For package changes, build and check the installed artifact outside the source checkout.
- For performance changes, compare equivalent workloads and confirm the result contract remains correct.
- Review whether Python's functions, protocols, collections, and standard operations express the design without redundant machinery.
- Review changed callers and public behavior, including parameter names, mutation, exceptions, and lazy execution.
- Report checks actually run, unresolved failures, and deliberate contract changes. Keep verification reports out of product documentation and code comments.

## Sources

- [Python language reference](https://docs.python.org/3/reference/) and [standard library](https://docs.python.org/3/library/): language and runtime contracts.
- [PEP 8](https://peps.python.org/pep-0008/) and [Google Python Style Guide](https://google.github.io/styleguide/pyguide.html): conventions and engineering guidance.
- [Python typing specification](https://typing.python.org/en/latest/spec/): static typing contracts.
- [Python Packaging User Guide](https://packaging.python.org/): project and distribution guidance.
- The task references link specific source sections, practitioner explanations, and tool documentation.
