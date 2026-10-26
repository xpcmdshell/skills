# Python antipatterns

- Read this reference before writing, changing, or reviewing Python code. These are review requirements, not optional style preferences.
- Fix violations in the requested change. Do not use this review to rewrite unrelated code or change established public contracts.
- A valid exception needs an actual input, API, or lifecycle requirement. Imagined future callers do not justify extra machinery.

## Do not disguise required data as optional

- Trace the producer before adding a guard. Preserve the concrete record or protocol that already describes its output.
- Access guaranteed attributes directly. Do not wrap them in `getattr(..., default)`, `hasattr`, or generic field extractors.
- Index required mapping keys directly after validation. Do not replace missing required keys with `.get(key, default)`.
- Do not widen known records into `object`, `Any`, or unstructured dictionaries merely to reconstruct their fields defensively.
- Fix incorrect annotations, incomplete initialization, or the responsible parser instead of making every consumer tolerate the defect.
- Do not add `str`, `int`, or truthiness fallbacks merely to make invalid values usable. Preserve valid zero and empty values.
- Validate external input where its shape becomes trusted. An annotation, dataclass, `TypedDict`, or `cast` does not perform that validation.
- Revalidate when external mutation or a new trust boundary invalidates earlier guarantees, not mechanically inside every helper.

### Example: an established field does not need rediscovery

- These fragments assume `report` already has a required string attribute named `title`.
- Rejected: the fallback hides a missing attribute, and conversion can turn invalid data into plausible output.

```python
title = str(getattr(report, "title", "") or "")
```

- Use direct access. A field rename must not silently produce an empty title.

```python
title = report.title
```

- Keep `getattr` for genuinely dynamic attribute names and `hasattr` for intentional optional-capability discovery.
- Keep `isinstance` for actual union narrowing and runtime validation. These rules do not prohibit Python's dynamic mechanisms.
- A field that always exists but can contain `None` needs a `None` check, not an attribute-existence check.
- Read [types and validation](types-and-validation.md) when establishing or changing the underlying data contract.

## Do not convert failure into apparent success

- Do not catch unexpected exceptions merely to log and return `None`, `{}`, `[]`, zero, or a success status.
- Do not use `except: pass`, catch-and-continue loops, or `contextlib.suppress` to hide unsuccessful work.
- Catch only where the code implements specified recovery, adds meaningful context, or reports failure at the owning boundary.
- Keep the protected operation narrow. A callback's programming error must not be mistaken for an expected lookup failure.
- A broad handler at a request or job boundary must still report the operation as failed when recovery is impossible.
- Do not add handlers that only reraise unchanged exceptions. Let those exceptions propagate directly.
- Do not return or jump out of `finally` to conceal a pending exception. Keep cleanup separate from result selection.
- Best-effort processing must expose rejected items or failures through its result or owning reporting boundary.
- Defaults belong to genuine optional choices. Missing data, malformed data, and unsuccessful operations are different outcomes.

### Example: recover only from the promised absence

- These complete alternatives read an optional UTF-8 note. Only a missing path means no note.
- Rejected: a decoding error, directory path, or permission error becomes indistinguishable from absence.

```python
from pathlib import Path


def read_optional_note(path: Path) -> str | None:
    try:
        return path.read_text(encoding="utf-8")
    except Exception:
        return None
```

- Use the exception that represents the supported recovery. An empty file remains an empty string.

```python
from pathlib import Path


def read_optional_note(path: Path) -> str | None:
    try:
        return path.read_text(encoding="utf-8")
    except FileNotFoundError:
        return None
```

- EAFP remains valid: attempt the operation and handle its specific expected failure, as this example does.
- Do not replace file operations with existence checks that can become stale before use.
- Keep intentional suppression for a documented harmless condition, such as an already-absent cleanup target.
- Read [errors and resources](errors-and-resources.md) for exception translation, cleanup, and reporting boundaries.

## Do not add machinery without a responsibility

- Do not add a class, factory, protocol, wrapper, or helper chain unless it owns meaningful state, policy, or complexity.
- Use functions and modules for stateless operations. Keep related logic together instead of splitting it into trivial forwarding helpers.
- Use established library operations instead of reimplementing them through nested lambdas, repeated conversions, or custom collection wrappers.
- Keep loops for branching, effects, and early exit. A dense comprehension is not an improvement over readable control flow.
- Do not introduce layers merely to make every internal call mockable. Verify public behavior through real integration boundaries.
- Keep abstractions that enforce invariants, own resources, or serve an actual consumer contract.
- Read [API design](api-design.md) for boundary choices and [verification](verification-and-performance.md) for meaningful behavioral checks.

### Example: preserve missing values while simplifying pandas work

- These fragments require pandas and an `orders` DataFrame with established numeric `price` and `quantity` columns.
- The operation retains every row. Missing prices remain unknown, while zero quantities can produce valid zero totals.
- Rejected: row-wise dispatch adds unnecessary work, and filling missing totals invents values.

```python
orders["line_total"] = orders.apply(
    lambda row: row["price"] * row["quantity"], axis=1
).fillna(0)
```

- Use the native column operation. Both columns share the frame's index.

```python
orders["line_total"] = orders["price"] * orders["quantity"]
```

- Do not add `.fillna`, `.dropna`, `errors="coerce"`, or casts without an explicit missing-value or conversion policy.
- Preserve required normalization. Removing these operations from existing code can also change the contract.
- Prefer native column, string, or datetime operations when equivalent. Keep `.apply` when the required operation has no suitable equivalent.
- Check index alignment, dtypes, ordering, and missing values before claiming equivalence. Do not optimize solely for fewer lines.

## Do not invent APIs or speculative compatibility

- Check unfamiliar imports, methods, signatures, and return values against the installed dependency and version-matched documentation.
- Exercise the real dependency boundary. A permissive mock can accept a method that the actual library does not provide.
- Do not guess replacement method names or build `hasattr` dispatch chains around an API you have not checked.
- Do not add packages, upgrade dependencies, or widen the supported version range merely to accommodate a generated call.
- Use the supported API for the project's actual versions. Keep compatibility adapters only for an established support requirement.
- Do not hide integration errors with `Any`, unchecked casts, blanket ignores, or unnecessary optional fields.
- Correct the dependency contract or isolate a verified typing limitation. A cast does not establish runtime correctness.
- Read [packaging and tooling](packaging-and-tooling.md) for environment selection and authorized migrations.

## Enforce syntax checks without pretending they prove contracts

- Use the bundled [Ruff preset](../assets/ruff-antipatterns.toml) through the [setup recipe](packaging-and-tooling.md#configure-antipattern-checks).
- The preset uses stable maintained Ruff rules and an explicit new-project baseline. It needs no custom parser, plugin, or preview mode.
- For existing projects, merge its additional rules without replacing their current selection or intentional exceptions.

| Rule | Detects | Important limit |
| --- | --- | --- |
| `B009`, `B010` | Constant-name `getattr` without a default and constant-name `setattr` where direct access fits. | `getattr(obj, "field", default)` and `hasattr` still need contract review. |
| `E722` | Bare `except` handlers. | `except Exception` can still hide failures. Changing the caught type alone is not a repair. |
| `B012` | `return`, `break`, or `continue` that exits `finally` and can discard an exception. | Cleanup and recovery semantics still need review. |
| `TRY203` | Useless handlers that immediately reraise without adding behavior. | Meaningful translation, cleanup, and reporting remain valid. |
| `PGH003`, `PGH004` | Blanket `type: ignore` and `noqa` comments. | A targeted suppression can still hide a real defect. |

- Do not ban all `hasattr`, defaulted `getattr`, `isinstance`, `Exception`, or `Any` to approximate missing type and contract analysis.
- Do not enable broad-exception or exception-pass bans by default. Legitimate boundary reporting and narrow cleanup suppression can trigger them.
- Do not replace dynamic access with a cast simply to satisfy lint. Fix the contract or explain a focused exception.
- Use suppression codes recognized by the actual checker. Explain the verified limitation instead of weakening project-wide checking.
- Review fixes before applying them. Attribute-name normalization and comment removal can make even simple rewrites unsafe.
- A clean lint result does not establish valid fallbacks, necessary abstractions, API availability, or correct data transformations.

## Sources

| Source | Supports |
| --- | --- |
| [SGLang's agent rule](https://github.com/sgl-project/sglang/blob/main/.claude/rules/no-getattr-defensive.md) and [Python attribute access](https://docs.python.org/3/library/functions.html#getattr) | Direct access to guaranteed fields, with legitimate dynamic access and narrowing. |
| [Dagster's agent guidance](https://dagster.io/blog/dignified-python-10-rules-to-improve-your-llm-agents) and [Python exception handling](https://docs.python.org/3/tutorial/errors.html#handling-exceptions) | Observable failures and narrow recovery. Dagster's broader LBYL preference is not a requirement here. |
| [Practitioner pandas examples](https://julianajackson.substack.com/p/how-to-spot-fix-llm-generated-code-python), [pandas function application](https://pandas.pydata.org/docs/user_guide/basics.html#row-or-column-wise-function-application), and [missing data](https://pandas.pydata.org/docs/user_guide/missing_data.html) | Native operations and explicit missing-value semantics. |
| [Ruff rules](https://docs.astral.sh/ruff/rules/) and [configuration](https://docs.astral.sh/ruff/configuration/) | Maintained syntax diagnostics and project configuration. |
| [Python typing casts](https://docs.python.org/3/library/typing.html#typing.cast) | Casts do not perform runtime checks. |
