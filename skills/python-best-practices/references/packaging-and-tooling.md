# Packaging and tooling

- Use this reference for project setup, dependencies, Git hooks, CI, distributions, supported versions, and static checks.
- Read [verification and performance](verification-and-performance.md) for behavioral checks and representative workloads.
- Read [types and validation](types-and-validation.md) when designing public type information.

## Match setup to the project

- Inspect the existing environment manager, build backend, lockfiles, task runner, and CI commands before changing configuration.
- Run checks through the project’s declared environment rather than whichever executable appears first on `PATH`.
- Keep working project tools until the user approves a migration. Offer suitable upgrades rather than silently retaining older tooling.
- For version upgrades or broader modernization, follow [version-target selection](#choose-supported-python-versions-deliberately) before deciding which Python releases remain supported.
- A local script can remain a script. Make it installable when entry points, reusable imports, resources, or distribution need packaging.
- Prefer `src/` for a new installable package. It separates importable code from the repository root.
- Preserve a working flat layout during unrelated maintenance.
- Do not add `sys.path` manipulation merely to hide incorrect packaging or test configuration.

- For new projects, use uv, Ruff, ty, pytest, and prek. Build supported pure-Python packages with `uv_build`.
- `uv_build` provides package discovery and includes package data and typing markers in the standard `src/` layout.
- Select another backend for native extensions, custom build scripts, or layouts that `uv_build` does not support.
- Compare replacements against the capabilities the project uses. A newer tool is not automatically a complete substitute.

Sources: [src versus flat layout](https://packaging.python.org/en/latest/discussions/src-layout-vs-flat-layout/), [pyproject.toml](https://packaging.python.org/en/latest/guides/writing-pyproject-toml/), and [uv project structure](https://docs.astral.sh/uv/concepts/projects/layout/).

## Offer tooling upgrades without migrating unasked

- When project inspection reveals older tooling with a suitable modern, mature replacement, tell the user and offer migration.
- Name the current tool, the proposed replacement, its practical benefit, and any compatibility constraints or migration work.
- Wait for explicit approval before changing dependencies, backend configuration, lockfiles, hooks, or CI for that migration.
- If the user declines, continue with the existing workflow. Do not repeatedly offer the same unchanged choice.

### Hatchling to uv_build

- If `[build-system].build-backend` selects `hatchling.build`, explicitly identify Hatchling rather than silently preserving it.
- Check package layout, package data, metadata generation, build hooks, and native-extension requirements against [uv_build's supported features](https://docs.astral.sh/uv/concepts/build-backend/).
- For a supported pure-Python package, offer `uv_build` as the preferred backend with standard package discovery and data inclusion.
- If required features are unsupported, explain the constraint rather than proposing a replacement that loses behavior.
- `uv build` is the build command; `uv_build` is the backend. Running the command alone does not replace Hatchling.

Example offer after confirming compatibility:

> This project uses Hatchling. Its pure-Python layout fits `uv_build`, our preferred backend for these packages.
> Would you like me to migrate it and verify the built wheel and source distribution?

- After approval, update the backend and affected configuration, then use the [installed-artifact checks](#verify-the-installed-artifact).

## Initialize the right kind of project

- Confirm the latest stable Python release from [Python’s downloads](https://www.python.org/downloads/).
- These commands use Python 3.15.1. Use the current stable release for new work unless another target is requested.
- Install uv through its [installation instructions](https://docs.astral.sh/uv/getting-started/installation/), then choose the appropriate project form.

| Work | Initialization | Result |
| --- | --- | --- |
| Standalone script | `uv init --script --python 3.15.1 report.py` | One file with PEP 723 dependency metadata. |
| Local application | `uv init --python 3.15.1 my-app` | A project environment without requiring a distribution. |
| Installable application | `uv init --package --python 3.15.1 my-app` | A package with an installed command entry point. |
| Library | `uv init --lib --python 3.15.1 event-report` | An installable `src/` package using `uv_build`. |

For a new library:

```sh
uv init --lib --python 3.15.1 event-report
cd event-report
uv add --dev 'ruff==0.17.2' ty pytest prek
```

- The Ruff pin matches the hook revision below. Update both together when adopting a new Ruff release.
- `uv add httpx` declares a runtime dependency. `uv remove httpx` removes it.
- `uv add --dev pytest` declares a development dependency rather than a consumer requirement.
- `uv add --optional plotting matplotlib` declares an installable consumer extra.
- `uv run command` executes inside the project environment. Manual activation is unnecessary.
- Use `uv add` and `uv remove` for project dependencies, not direct installation into a uv-managed project environment.
- Commit `pyproject.toml`, `uv.lock`, and the chosen `.python-version`. Do not commit `.venv`.

For a standalone script with an external dependency:

```sh
uv init --script --python 3.15.1 report.py
uv add --script report.py rich
uv lock --script report.py
uv run --locked --python 3.15.1 report.py
```

- Keep the script’s dependency metadata with its code instead of creating a package only to install dependencies.
- Commit `report.py.lock` when the script needs a shared reproducible environment.
- `uv run --locked` checks that the script lockfile agrees with its metadata.

Sources: [uv project creation](https://docs.astral.sh/uv/concepts/projects/init/), [dependency management](https://docs.astral.sh/uv/concepts/projects/dependencies/), and [script dependencies and locking](https://docs.astral.sh/uv/guides/scripts/#locking-dependencies).

## Separate metadata and dependency roles

| Location | Responsibility |
| --- | --- |
| `[build-system]` | Backend and dependencies required to build the distribution. |
| `[project]` | Distribution identity, version, runtime requirements, supported Python versions, and other package metadata. |
| `[project.optional-dependencies]` | Optional features consumers can install as extras. |
| `[dependency-groups]` | Development or workflow dependencies that are not published runtime requirements. |
| `[project.scripts]` | Installed command names and callable entry points. |
| `[tool.*]` | Configuration owned by particular tools. |

- Declare directly used runtime dependencies rather than relying on accidental transitive installation.
- Choose version bounds from required features or known incompatibilities, not guessed future breakage.
- Keep development tools out of consumer runtime dependencies unless the product actually needs them.
- Keep environment directories out of version control.
- Let the selected tool manage its lockfile rather than editing resolved entries manually.
- Commit a project lockfile when it defines the shared development or deployment environment.
- A library’s development lockfile does not force its consumers to use that exact environment.
- Library dependency ranges describe compatibility; a lockfile records a particular resolution.
- Do not pin every transitive dependency in public metadata merely because a local environment uses those versions.
- A single successful locked installation does not establish every version in a declared compatibility range.

Sources: [project metadata](https://packaging.python.org/en/latest/guides/writing-pyproject-toml/), [dependency groups](https://packaging.python.org/en/latest/specifications/dependency-groups/), and [abstract versus environment requirements](https://packaging.python.org/en/latest/discussions/install-requires-vs-requirements/).

## Choose supported Python versions deliberately

- Default new projects to the latest stable Python release and its current features.
- For version upgrades or broader modernization, inspect the current support range and offer concrete target versions.
- A newer development interpreter and a higher minimum supported version are separate changes. State which changes the proposal includes.
- `.python-version` selects a development interpreter. `[project].requires-python` declares package compatibility; changing one does not replace the other.
- Existing `requires-python`, classifiers, and CI jobs describe current support. An upgrade request puts that support range up for discussion.
- Do not silently retain the old minimum while describing the work as a full language-version migration.

| Choice to offer | Meaning and tradeoff |
| --- | --- |
| Supported conservative target | Select a concrete, well-supported release with suitable dependencies and deployment availability. Raise the minimum to that target if agreed; this need not retain the old minimum. |
| Latest stable target | Raise the minimum to the current stable release and use its useful language and library features. Confirm dependencies and deployment can follow. |
| Tooling-only upgrade | Keep a stated runtime support range while updating development tools. Offer this when older consumers are a real concern, not as the silent interpretation of version modernization. |

- Name actual candidate releases, their upstream support status, and the reason each fits the project.
- Before recommending a target, inspect dependency requirements, relevant wheels or source-build paths, framework support, and deployment images or runtimes.
- Popularity does not establish continuing support. Use an LTS label only when the relevant provider documents that support commitment.
- Recommend a target and ask when the request leaves the support range open. Do not ask again when the user already chose it.
- A dependency blocker needs an explicit alternative or migration path, not an unannounced fallback to the previous minimum.
- Once approved, update `requires-python`, development interpreter selection, relevant dependency resolution, and any version-specific metadata together.
- Align formatter and type-checker targets, runtime checks, deployment configuration, documentation, and CI with the chosen support range.
- Ruff and ty can infer the target from `requires-python`. Avoid redundant version settings that can drift.
- Use newer language features where they improve the implementation. Remove compatibility branches and obsolete CI versions when their support is dropped.
- Test the agreed minimum and other relevant supported environments. Build and exercise the installed artifact on the selected target.
- During unrelated work, preserve the established minimum. An explicit language upgrade is not unrelated work.
- Check syntax and runtime imports. Deferred annotations do not make unavailable runtime APIs usable.
- Use version-matched documentation when behavior changes across releases.
- Avoid speculative Python upper bounds that reject later compatible interpreters.

Sources: [Python version status](https://devguide.python.org/versions/), [requires-python](https://packaging.python.org/en/latest/guides/writing-pyproject-toml/#requires-python), and [uv Python version requests](https://docs.astral.sh/uv/concepts/python-versions/#requesting-a-version).

## Example: an installable pure-Python package

- This example targets Python 3.15. Its build-backend bound follows uv’s documented minor-series compatibility policy.
- The source package is `event_report`; the distribution name is `event-report-example`.
- The example includes package data and typing metadata so installed consumers can use both.
- Put the [file-parsing example](errors-and-resources.md#example-borrowed-parsing-and-owned-file-access) in `src/event_report/readers.py`.
- Re-export `open_levels` from `src/event_report/__init__.py` to support the consumer’s `from event_report import open_levels`.

```text
pyproject.toml
src/
  event_report/
    __init__.py
    cli.py
    readers.py
    heading.txt
    py.typed
tests/
```

```toml
[build-system]
requires = ["uv_build>=0.13.5,<0.14"]
build-backend = "uv_build"

[project]
name = "event-report-example"
version = "0.1.0"
requires-python = ">=3.15"

[project.scripts]
event-report = "event_report.cli:main"

[dependency-groups]
dev = ["pytest", "ruff==0.17.2", "ty", "prek"]

[tool.uv.build-backend]
module-name = "event_report"

[tool.ruff]
extend = "ruff-antipatterns.toml"

[tool.ruff.lint]
extend-select = ["I", "UP", "B"]

[tool.pytest.ini_options]
addopts = ["--import-mode=importlib"]
```

- Copy the bundled [Ruff antipattern preset](../assets/ruff-antipatterns.toml) to `ruff-antipatterns.toml` beside this `pyproject.toml`.
- Follow [antipattern setup](#configure-antipattern-checks) when merging into an existing Ruff configuration.
- `module-name` is explicit because the import name differs from the normalized distribution name, `event_report_example`.
- Omit that setting when the normalized distribution name already matches the source package.
- Refresh the backend bound from uv’s current documentation when adopting a new backend release.
- Fill in description, documentation, license, and release metadata before distributing a real package.
- The package’s entry point returns an exit status or raises an appropriate application-level failure.
- Keep command execution behind the entry point, not in import-time code.
- Read packaged data with `importlib.resources`, not paths relative to the process’s working directory.
- Include `py.typed` when shipping inline annotations as a typed library.
- Verify the built distribution rather than assuming configuration includes every intended file.

Sources: [uv build backend](https://docs.astral.sh/uv/concepts/build-backend/), [entry points and metadata](https://packaging.python.org/en/latest/guides/writing-pyproject-toml/#creating-executable-scripts), [package resources](https://docs.python.org/3/library/importlib.resources.html), and [distributing typing information](https://typing.python.org/en/latest/spec/distributing.html).

## Configure antipattern checks

- The bundled preset uses stable maintained Ruff rules. It needs no custom parser, plugin, or preview mode.
- For a new project, copy [assets/ruff-antipatterns.toml](../assets/ruff-antipatterns.toml) into the project as `ruff-antipatterns.toml`.
- The preset selects `E4`, `E7`, `E9`, and `F` as an explicit baseline, then adds the targeted antipattern checks.
- Ruff's defaults change across releases and can include broader exception rules. New projects use this baseline to avoid adopting them implicitly.
- The configuration above inherits that preset and adds import sorting, modernization, and bugbear checks through `extend-select`.
- Commit both configuration files. The existing Ruff command, official hook, and CI then use the same rules without another runner.
- In an existing project, merge the preset's rule codes into the active configuration's `lint.extend-select` after reviewing current policy.
- Use `tool.ruff.lint.extend-select` inside `pyproject.toml`, or `lint.extend-select` inside `ruff.toml` and `.ruff.toml`.
- Preserve existing selection, ignores, exclusions, and `extend` chains. Do not overwrite another configuration or add a competing one.
- Merge only `extend-select` for existing projects. Do not copy the new-project baseline over their current selection.
- Existing `B` selection already includes `B009`, `B010`, and `B012`. Ruff's defaults already include `E722`.
- Inspect intentional exclusions before enabling a conflicting rule. Keep justified narrow exceptions instead of forcing a blanket policy change.

Audit without editing configuration:

```sh
uv run --locked ruff check --extend-select B009,B010,B012,E722,PGH003,PGH004,TRY203 .
```

- This command adds rule selection to the discovered project configuration. Do not replace project settings with `--config` pointing only at the preset.
- Review diagnostics before enabling enforcement. The preset does not ban `hasattr`, dynamic names, runtime narrowing, or specified recovery.
- Check the project's Ruff version with `ruff rule <code>` if a diagnostic differs. Do not install a second competing linter.

### Rule coverage and limits

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

## Run checks without changing their meaning

- Follow the repository’s task commands when they coordinate environment setup or additional checks.
- In a new uv project, resolve dependencies deliberately with `uv lock`, then synchronize with `uv sync --locked`.
- During verification, `--locked` rejects an out-of-date lockfile instead of updating it silently.
- `--frozen` skips the freshness check. It is not equivalent to verifying that metadata and resolution agree.
- Install declared tools into the project environment so developers and CI run the same versions.
- Check the same files with the same options in local work and CI.

For a uv project declaring the default tools:

```sh
uv sync --locked
uv run --locked ruff format --check .
uv run --locked ruff check .
uv run --locked ty check
uv run --locked pytest
```

- Use `ruff format` when applying formatting changes, then inspect the resulting diff.
- Select additional rules for actual needs. Enabling `ALL` also adopts future rules and can impose conflicting or irrelevant choices.
- Review fixes that can change behavior, especially exception types, evaluation, or public interfaces.
- Do not apply `--unsafe-fixes` indiscriminately to obtain a clean report.
- Use narrow suppressions for confirmed tool limitations or intentional exceptions. Explain the reason when it is not obvious.
- Check interpreter and import resolution before treating a missing dependency as a typing problem.
- Do not hide unknown imports or untyped boundaries behind project-wide ignores merely to make checking pass.
- Match strictness to useful coverage and project policy. Different checkers’ strict modes are not equivalent.

Sources: [uv locking and syncing](https://docs.astral.sh/uv/concepts/projects/sync/), [Ruff fixes and rules](https://docs.astral.sh/ruff/linter/), [ty environment discovery](https://docs.astral.sh/ty/modules/#python-environment), and [ty checking differences](https://docs.astral.sh/ty/coming-from-mypy-or-pyright/).

## Install commit hooks and run the same checks in CI

- Use `prek.toml` for a new prek setup. Keep a working `.pre-commit-config.yaml` instead of adding a competing configuration.
- The official `ruff-pre-commit` repository supplies Ruff installation, hook commands, and file filters.
- Ruff’s hook environment is separate from the project environment. Its revision selects the Ruff version independently of `uv.lock`.
- The local ty hook uses the project environment so it can resolve the project’s dependencies.

Create `prek.toml` in the Git root:

```toml
[[repos]]
repo = "https://github.com/astral-sh/ruff-pre-commit"
rev = "v0.17.2"
hooks = [
  { id = "ruff-check", args = ["--fix"] },
  { id = "ruff-format" },
]

[[repos]]
repo = "local"

[[repos.hooks]]
id = "ty-check"
name = "ty check"
entry = "uv run --locked ty check"
language = "system"
pass_filenames = false
always_run = true
```

- Keep lint fixes before formatting. A fix can produce code that needs reformatting.
- Default hook ordering is sequential. Do not configure the two mutating Ruff hooks to run concurrently.
- The official filters include Python, stubs, and notebooks. The formatter also handles Python code blocks in Markdown.
- `pass_filenames = false` lets ty check the whole project rather than only changed files.
- `always_run = true` also checks typing after metadata-only or deletion-only changes.
- Make uv available on Git’s `PATH`, including when committing through a GUI. No environment activation is required.

Install hooks in a clone and check the tracked files:

```sh
uv sync --locked
uv run --locked prek install
uv run --locked prek run --all-files
```

- `prek install` installs the Git hook for this clone. Each contributor runs it after setup.
- Normal commits check staged content. If Ruff changes files, review and stage those changes before committing again.
- `--all-files` selects Git-tracked files for file-based hooks. Stage new files before using it as a full repository check.
- The ty hook still performs its own project-wide file discovery.
- Pin remote hook revisions. Review hook and tool updates together instead of using a moving branch.

Run the same configuration in CI after installing uv and checking out the repository:

```sh
uv sync --locked
uv run --locked prek run --all-files
uv run --locked pytest
uv build
```

- CI does not need `prek install`. It invokes the configured checks directly.
- Fixing hooks fail when they change files, so CI requires those corrections in the submitted changes.
- Run behavioral verification in CI. Hooks give earlier feedback but can be bypassed.
- Build only projects that produce distributions, then verify the installed artifact as described below.
- Add secret scanning, dependency audits, shell checks, or workflow checks where the repository needs them.

Sources: [official Ruff hooks](https://github.com/astral-sh/ruff-pre-commit), [prek configuration](https://prek.j178.dev/configuration/), [local hooks](https://prek.j178.dev/local-hooks/), and [prek in CI](https://prek.j178.dev/ci/).

## Offer cccc during tooling setup

- When setting up or refreshing Python tooling, offer [cccc](https://github.com/moznion/cccc) even when the user does not name it.
- Explain that it measures control-flow complexity and can enforce a per-function cognitive-complexity limit.
- Propose **15 per function**, the limit used in cccc's documented examples. Preserve an existing project policy.
- Ask whether to enable the check at commit time, in CI, or both. Do not install or enable it when declined.
- Locally, use the installed `cccc`. If missing, follow the [platform-specific installation instructions](https://github.com/moznion/cccc#install--build).
- CI has its own environment. Provision cccc there with the official action below, not through the local installation.
- cccc is a standalone binary, separate from the uv project environment.
- Before enabling a blocking policy, run `cccc --no-config --lang python --table .` from the Git root.
- Inspect existing findings and parser diagnostics. A partial parse can return success with an incomplete score.
- Agree how to handle existing violations before enabling the gate. Do not rewrite unrelated code merely to adopt it.
- Check parser support for the project's language features. Do not replace valid current syntax to accommodate an unsupported parser.

### cccc.toml

- Create this file in the Git root after accepting the proposed threshold, or use the agreed project value.

```toml
languages = ["python"]
max-cognitive = 15
```

- This gates cognitive complexity only. It does not impose a cyclomatic-complexity limit.
- The command below scans the project, respecting ignore files. Adjust source roots or exclusions only for an explicit project policy.
- Do not exclude tests or difficult files merely to obtain a passing result.

### Add the selected commit hook

- If commit-time checking is selected, append this hook to the existing local repository block in `prek.toml`.

```toml
[[repos.hooks]]
id = "cccc"
name = "Cognitive complexity"
entry = "cccc --config cccc.toml ."
language = "system"
pass_filenames = false
always_run = true
```

- The hook scans the configured source population, including after configuration-only or deletion-only changes.
- Install the updated Git hook with `uv run --locked prek install` if the clone does not already have it.

### Run the accepted complexity check

```sh
set -eu
cccc --version
cccc --config cccc.toml .
```

- On GitHub Actions, use a normal GitHub-hosted runner such as `runs-on: ubuntu-latest` unless the project already specifies otherwise.
- Do not introduce a self-hosted runner or custom runner label without explicit approval.
- After checkout, use the [official cccc action](https://github.com/moznion/cccc-action) to install and run the check:

```yaml
- uses: moznion/cccc-action@v1
  with:
    path: .
    config: cccc.toml
```

- If the shared `uv run --locked prek run --all-files` command already runs cccc, omit the action's `with` block.
- With no `path`, the action only installs cccc. Place it before the shared check command to avoid duplicate analysis.
- For CI-only checking, omit the local cccc hook and use the action with `path` as shown.
- Let the action handle CI installation. No local reinstall, custom download script, or cccc version override is needed.
- For hook-only checking, set `stages = ["pre-commit"]` on this hook.
- In that case, run CI's other shared checks with `uv run --locked prek run --hook-stage manual --all-files`.
- Confirm that the project's other hooks support the `manual` stage. The standard hooks above do.
- Commit `cccc.toml` and the selected hook configuration.
- Review flagged functions for understandable control flow and coherent responsibilities. The score is a review signal, not proof of design quality.
- Do not split code into trivial helpers, obscure control flow, or weaken configuration solely to satisfy the score.
- If the clearest implementation conflicts with the gate, explain the conflict and seek an approved exception or policy change.
- Rerun behavioral checks after meaningful refactoring.

Sources: [cccc configuration and usage](https://github.com/moznion/cccc#configuration-file), [parser diagnostics](https://github.com/moznion/cccc#parse-errors), and [prek hook stages](https://prek.j178.dev/reference/configuration/).

## Verify the installed artifact

- Build the package and inspect the generated artifacts.
- Install the exact wheel under review into a clean consumer environment.
- Run consumer checks from outside the source checkout and without source-path overrides.
- Verify the promised import paths, CLI entry points, package resources, dependencies, and supported interpreter behavior.
- Check that source distributions contain what a downstream build needs when publishing them.
- Editable installs support development; they do not prove that a wheel contains all required files.
- Keep development-only imports and accidental repository files from becoming hidden runtime requirements.

Build the package from its project directory:

```sh
uv build
```

- Use the exact wheel path reported by the build, not a glob that can select an older artifact.
- The following POSIX-shell commands create an isolated consumer environment. Set `WHEEL` to that absolute path first.
- Use the project’s chosen interpreter. Add a minimum-version check only when that compatibility is promised.

```sh
CHECK_DIR=$(mktemp -d)
uv venv --python 3.15.1 "$CHECK_DIR/venv"
uv pip install --python "$CHECK_DIR/venv/bin/python" "$WHEEL" ty
cd "$CHECK_DIR"
"$CHECK_DIR/venv/bin/python" -I -c 'import event_report'
"$CHECK_DIR/venv/bin/event-report" --help
```

- On Windows, use the environment’s `Scripts` directory and platform-appropriate shell syntax.
- Extend this smoke check with actual operations, resource access, and failure cases from the package’s contract.
- For a typed library, check representative consumer code against the installed package, not only its source tree.
- Create `consumer.py` in `CHECK_DIR` with this consumer of the example package:

```python fragment
from pathlib import Path

from event_report import open_levels


def read_event_levels(path: Path) -> list[str]:
    with open_levels(path) as levels:
        return list(levels)
```

```sh
"$CHECK_DIR/venv/bin/ty" check --python "$CHECK_DIR/venv/bin/python" consumer.py
```

- The checker must accept valid calls and reject invalid argument types, such as `open_levels(42)`.
- An unresolved package import is an environment or distribution failure, not a diagnostic to suppress.
- Passing consumer checks does not establish completeness of every exported annotation.
- When a library promises complete public type information, Pyright’s `--verifytypes` supplies a separate completeness check.
- For that check, install Pyright in the scratch consumer environment and activate it so package discovery finds the wheel.

```sh
uv pip install --python "$CHECK_DIR/venv/bin/python" pyright
. "$CHECK_DIR/venv/bin/activate"
pyright --verifytypes event_report
```

- Type completeness measures available type information. It does not prove runtime behavior or domain validity.
- Preserve public parameter names and exports when changing annotations; keyword callers and type-checking consumers depend on them.

Sources: [pytest integration practices](https://docs.pytest.org/en/stable/explanation/goodpractices.html), [Pyright library verification](https://github.com/microsoft/pyright/blob/main/docs/typed-libraries.md#verifying-type-completeness), and [typing library interfaces](https://typing.python.org/en/latest/spec/distributing.html#library-interface).
