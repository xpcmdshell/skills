# Modules and tooling

Read this reference for project layout, dependencies, toolchains, agent checks, Git hooks, CI, and distributable commands or libraries.

## Separate packages, modules, and commands

| Boundary | Responsibility |
| --- | --- |
| Package | Compiled Go files with one package identity and a coherent API. Imports name packages. |
| Module | A versioned collection of packages rooted at `go.mod`. Module requirements select dependencies. |
| Command | A `package main` containing `func main`. Building it produces an executable. |
| Workspace | A set of local main modules selected by `go.work`. It changes local dependency resolution. |

- Start with one module unless independent versioning or another concrete boundary requires more.
- A small package or command can live at the module root. Do not require a directory hierarchy for its own sake.
- Use `cmd/<command>` when several commands or a library and command share a repository.
- Use `internal` for packages whose callers must remain within the permitted import tree. This is an enforced import boundary.
- Export a package only when external callers need a supported interface.
- Avoid mandatory `pkg`, `src`, controller, service, or repository layers copied from another ecosystem.
- Keep domain behavior independent of command-line presentation. Let `main` assemble dependencies and choose process status.
- Match import paths to the module path and package location. A local directory name does not determine the published module identity.
- See [module layout](https://go.dev/doc/modules/layout) and [packages and APIs](packages-and-apis.md).

## Use the current toolchain deliberately

- Default new projects to the latest stable Go release and its current language and library features.
- During version upgrades or broader modernization, use [target selection](#choose-the-version-upgrade-target) instead of assuming the existing minimum must remain.
- Confirm the release through [Go downloads](https://go.dev/dl/), not the age of the locally installed compiler.
- Inspect `go version`, `go env GOTOOLCHAIN GOWORK GOOS GOARCH CGO_ENABLED`, and the module files.
- The `go` directive declares a required Go version and controls language-version behavior. It is not merely documentation.
- A `toolchain` directive suggests a toolchain for work in that main module. It does not replace the `go` requirement.
- `GOTOOLCHAIN` controls toolchain selection and can permit automatic downloads. Use deliberate CI and project settings.
- A new module can run `go get go@latest` after `go mod init` to select the latest stable requirement.
- Do not assume `go mod init` selects the latest language requirement. Current Go intentionally initializes a supported earlier requirement.
- Review changes to language requirements and build behavior when modernizing existing code. Do not silently claim old-version compatibility.
- Use current `go fix` modernizers during relevant modernization work. Review their diff and verify behavior before accepting it.
- Use current `go doc` for APIs, including `go doc package@version` when inspecting a selected dependency version.
- Do not enable experimental features merely because the stable toolchain contains them. An experiment is not a stable-language default.
- Sources: [toolchain selection](https://go.dev/doc/toolchain), [module directives](https://go.dev/ref/mod#go-mod-file-go), [Go 1.26 tools](https://go.dev/doc/go1.26#tools), [Go 1.27 tools](https://go.dev/doc/go1.27#tools).

### Choose the version-upgrade target

- Separate the working compiler version from the module's minimum requirement. Changing `toolchain` alone does not raise the `go` directive.
- Inspect existing directives, dependency requirements, supported deployments, and public-library consumer commitments before proposing targets.
- Offer a concrete supported conservative release and the latest stable release when both are viable.
- Explain the useful features, upstream support status, dependency readiness, and migration work for each candidate.
- A conservative target can still raise the old minimum. Do not equate conservative modernization with retaining every previous version.
- Offer a compiler-only upgrade when retaining older consumers is an actual goal. State its language-feature limits explicitly.
- Use an LTS label only when the relevant provider documents that commitment; popularity alone does not establish maintenance support.
- Recommend a target and ask when the request leaves it open. Apply an already selected target without another approval loop.
- If dependencies, cgo libraries, analyzers, or deployment environments block the target, explain the blocker and viable migration options.
- Do not silently preserve the previous requirement and call that a full language-version migration.
- After approval, align `go.mod`, affected workspace directives, toolchain selection, dependencies, CI, and support documentation.
- Use useful language and standard-library features permitted by the new requirement. Remove obsolete compatibility paths within the migration scope.
- Verify builds and public behavior on the agreed minimum and relevant deployment targets, including external consumers for libraries.
- Preserve existing requirements during unrelated work; an explicitly requested version upgrade can change them.

Sources: [Go release support policy](https://go.dev/doc/devel/release#policy), [toolchain and language versions](https://go.dev/doc/toolchain), and [module requirements](https://go.dev/ref/mod#go-mod-file-go).

## Keep dependency changes explainable

- Reuse the standard library when its semantics fit. Select a maintained dependency when it avoids implementing a substantial existing facility.
- Inspect the dependency's public contract, maintenance, license, toolchain requirement, and effects on the module graph.
- Use `go get module@version` for deliberate dependency changes. Review indirect upgrades and changes to the `go` directive.
- Avoid unrelated `go get -u ./...` upgrades during a local fix.
- Minimal version selection chooses the highest required version of each module in the relevant graph. It does not mean “always newest.”
- `go.sum` records content checksums. It is not a second dependency-selection file or a complete lockfile model from another ecosystem.
- Commit the module's required `go.mod` and `go.sum` changes. A standard-library-only module might not need `go.sum`.
- Run `go mod tidy` after relevant import or dependency changes. Review the result rather than hand-editing indirect requirements away.
- Use `go mod tidy -diff` for a non-mutating consistency check.
- Use `go mod why -m <module>` and `go mod graph` to explain a dependency instead of deleting unfamiliar entries.
- `go mod verify` checks downloaded module-cache contents against their recorded hashes. It does not establish correctness or vulnerability freedom.
- Do not disable checksum verification globally to make a failing download succeed.
- Configure private module paths through the appropriate `GOPRIVATE`, proxy, and checksum settings without embedding credentials in source.
- If a project vendors dependencies, follow that workflow and review `go mod vendor` output after graph changes.
- Sources: [module reference](https://go.dev/ref/mod), [minimal version selection](https://go.dev/ref/mod#minimal-version-selection), [private modules](https://go.dev/ref/mod#private-modules).

## Treat workspace behavior as local build input

- `go.work` can make unpublished local changes satisfy imports that a standalone consumer cannot resolve.
- A `replace` directive applies in the main-module or workspace context. A dependency cannot impose its own replacements on callers.
- Test an independently usable module with `GOWORK=off` as well as any required multi-module workspace workflow.
- Keep workspace files when they represent the team's intended workflow. Do not commit machine-specific paths as shared configuration.
- Use a local replacement deliberately for a pre-release consumer check. It verifies the local source, not a published tag or module archive.
- For releases, verify the candidate version through the intended module distribution path when it becomes available.
- A major version at v2 or later normally appears in the module and import path. Do not treat a breaking release as a tag-only change.
- Apply compatibility promises deliberately. Do not add deprecation shims or staged migrations unless the required release policy needs them.
- Sources: [workspaces](https://go.dev/ref/mod#workspaces), [replace](https://go.dev/ref/mod#go-mod-file-replace), [major version suffixes](https://go.dev/ref/mod#major-version-suffixes).

## Use project tools without inventing another build system

| Need | Established tool or mechanism |
| --- | --- |
| Formatting and import repair | `goimports` on edited files. It adds missing imports, removes unused imports, and applies gofmt-style formatting. |
| Native static checks | `go vet ./...` on complete packages. Default `go test` runs only a subset of vet checks. |
| Additional static checks | Staticcheck for correctness and API misuse; errcheck for discarded errors. |
| Known vulnerabilities | `govulncheck` with findings evaluated against the affected versions and call paths. |
| Developer tool dependencies | `go get -tool <package>@<version>`, then `go tool <command>`. |
| Generated code | Explicit `go generate` directives and the project's reproducible generation command. |
| Behavioral evidence | Integration/e2e checks, race-instrumented workloads, and actual consumer builds. |

- Tool directives keep executable-tool versions in the module graph. Review their transitive dependency effects like other dependencies.
- Use a separate tools module only when dependency isolation or another actual requirement justifies it.
- `go generate` is not part of ordinary `go build`. Document or encode the generation step when artifacts depend on it.
- Generated output needs a clear ownership and regeneration policy. Do not manually edit generated files and leave their source inconsistent.
- Keep formatter and analyzer versions compatible with the current language syntax they must parse.
- Reuse an existing golangci-lint command when it already supplies the relevant analyzers. Do not run duplicate checks.
- Understand a diagnostic before changing code. Use `staticcheck -explain <ID>` and the check's documentation when needed.
- Handle a discarded error according to the operation's contract. Do not replace an unchecked call with `_ = call()` only to pass checking.
- Default errcheck accepts explicit discards. Its `-blank` option checks those too, but cannot decide the correct error policy.
- Inspect imports selected by goimports. A resolved name does not prove that the selected dependency is the intended one.
- Sources: [`cmd/go`](https://pkg.go.dev/cmd/go), [goimports](https://pkg.go.dev/golang.org/x/tools/cmd/goimports), [Staticcheck](https://staticcheck.dev/docs/), [errcheck](https://github.com/kisielk/errcheck), [Go vulnerability management](https://go.dev/doc/security/vuln/).

## Configure checks, commit hooks, and CI

- Use this recipe for a new Go project with one module at the Git root.
- In an existing project, use its equivalent checks and hook configuration instead of adding a competing workflow.
- For a new module, run `go mod init <module-path>` and select the current stable requirement with `go get go@latest`.
- Match build tags, workspace use, and target platforms to the real project. A root `./...` does not cover every nested module.
- For multiple modules, run the checks from each module root or use the project's workspace-aware check command.

| Boundary | What runs |
| --- | --- |
| Agent completion | The agent runs the shared checks and relevant behavioral verification before returning work. |
| Git commit | An installed prek hook runs the shared checks automatically against staged content. |
| CI | CI runs the same checks independently, plus builds, behavioral verification, and vulnerability scanning. |

### Register the Go tools

- Run these commands from the module root after adding the initial Go source files.
- The versions below are concrete setup inputs. Review tool and transitive dependency changes when updating them.

```sh
set -eu
go get -tool \
  golang.org/x/tools/cmd/goimports@v0.52.0 \
  honnef.co/go/tools/cmd/staticcheck@v0.8.2 \
  github.com/kisielk/errcheck@v1.30.0 \
  golang.org/x/vuln/cmd/govulncheck@v1.9.0
go mod tidy
```

- Commit the resulting `go.mod` and `go.sum`. Tool directives retain the command dependencies through tidying.
- `go tool <name>` builds and runs the tool selected by the module graph. No global analyzer installation is required.
- Tool dependencies share that graph. A tool update can also change selected application dependencies; review and verify both.
- Use a separate tools module only when actual dependency conflicts or isolation requirements justify it.

Sources: [tool directives](https://go.dev/ref/mod#go-mod-file-tool) and [`go tool`](https://pkg.go.dev/cmd/go#hdr-Run_specified_go_tool).

### Define the shared checks

- Create `prek.toml` in the Git root. Keep an existing supported hook configuration instead of creating two configurations.

```toml
[[repos]]
repo = "local"

[[repos.hooks]]
id = "goimports"
name = "Go formatting and imports"
entry = "go tool goimports -w"
language = "system"
types = ["go"]
require_serial = true

[[repos.hooks]]
id = "go-mod-tidy"
name = "Go module metadata"
entry = "go mod tidy -diff"
language = "system"
pass_filenames = false
always_run = true

[[repos.hooks]]
id = "go-vet"
name = "Go vet"
entry = "go vet ./..."
language = "system"
pass_filenames = false
always_run = true

[[repos.hooks]]
id = "go-staticcheck"
name = "Go Staticcheck"
entry = "go tool staticcheck ./..."
language = "system"
pass_filenames = false
always_run = true

[[repos.hooks]]
id = "go-errcheck"
name = "Go unchecked errors"
entry = "go tool errcheck ./..."
language = "system"
pass_filenames = false
always_run = true
```

- Keep the formatter first. Prek runs these hooks sequentially unless priorities explicitly change that order.
- Only goimports receives selected filenames. Native and additional semantic checks load complete packages.
- `always_run = true` also checks metadata-only and deletion-only commits.
- `go mod tidy -diff` rejects inconsistent metadata without rewriting it. Run `go mod tidy` deliberately when a dependency change requires it.
- `language = "system"` uses the available Go toolchain. It does not create a separate environment or install Go.
- Make `go` available on the Git process's `PATH`, including when Git runs through another application.
- Do not implement a formatting gate by checking only gofmt's exit status. `gofmt -l` can list unformatted files and still succeed.
- Here, prek detects the formatter's file changes and fails the check until the corrected content is submitted.

Sources: [prek configuration](https://prek.j178.dev/configuration/), [local hooks](https://prek.j178.dev/local-hooks/), and [hook options](https://prek.j178.dev/reference/configuration/).

### Offer cccc during tooling setup

- When setting up or refreshing Go tooling, offer [cccc](https://github.com/moznion/cccc) even when the user does not name it.
- Explain that it measures control-flow complexity and can enforce a per-function cognitive-complexity limit.
- Propose **15 per function**, the limit used in cccc's documented examples. Preserve an existing project policy.
- Ask whether to enable the check at commit time, in CI, or both. Do not install or enable it when declined.
- Locally, use the installed `cccc`. If missing, follow the [platform-specific installation instructions](https://github.com/moznion/cccc#install--build).
- CI has its own environment. Provision cccc there with the official action below, not through the local installation.
- cccc is a standalone binary, separate from the Go tool dependencies.
- Before enabling a blocking policy, run `cccc --no-config --lang go --table .` from the Git root.
- Inspect existing findings and parser diagnostics. A partial parse can return success with an incomplete score.
- Agree how to handle existing violations before enabling the gate. Do not rewrite unrelated code merely to adopt it.
- Check parser support for the project's language features. Do not replace valid current syntax to accommodate an unsupported parser.

#### cccc.toml

- Create this file in the Git root after accepting the proposed threshold, or use the agreed project value.

```toml
languages = ["go"]
max-cognitive = 15
```

- This gates cognitive complexity only. It does not impose a cyclomatic-complexity limit.
- The command below scans the project, respecting ignore files. Adjust source roots or exclusions only for an explicit project policy.
- Do not exclude tests or difficult files merely to obtain a passing result.

#### Add the selected commit hook

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
- Install the updated Git hook with `prek install` if the clone does not already have it.

#### Run the accepted complexity check

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

- If the shared `prek run --all-files` command already runs cccc, omit the action's `with` block.
- With no `path`, the action only installs cccc. Place it before the shared check command to avoid duplicate analysis.
- For CI-only checking, omit the local cccc hook and use the action with `path` as shown.
- Let the action handle CI installation. No local reinstall, custom download script, or cccc version override is needed.
- For hook-only checking, set `stages = ["pre-commit"]` on this hook.
- In that case, run CI's other shared checks with `prek run --hook-stage manual --all-files`.
- Confirm that the project's other hooks support the `manual` stage. The standard hooks above do.
- Commit `cccc.toml` and the selected hook configuration.
- Review flagged functions for understandable control flow and coherent responsibilities. The score is a review signal, not proof of design quality.
- Do not split code into trivial helpers, obscure control flow, or weaken configuration solely to satisfy the score.
- If the clearest implementation conflicts with the gate, explain the conflict and seek an approved exception or policy change.
- Rerun behavioral checks after meaningful refactoring.

Sources: [cccc configuration and usage](https://github.com/moznion/cccc#configuration-file), [parser diagnostics](https://github.com/moznion/cccc#parse-errors), and [prek hook stages](https://prek.j178.dev/reference/configuration/).

### Install the commit hook

- Install prek through its [standalone installation instructions](https://prek.j178.dev/installation/) or the project's established tool installer.
- This recipe uses prek 0.5.7. Use the same selected version locally and in CI.
- The standalone binary does not require Python project tooling.
- From the module root in a Git checkout:

```sh
set -eu
prek --version
prek install
prek run --all-files
```

- Each contributor installs the hook in each clone. Committing `prek.toml` does not install it automatically.
- Prek checks staged content during a normal commit. If formatting changes files, review and stage those changes before committing again.
- `--all-files` selects Git-tracked files for the formatter. Add new files to the index before the final check.
- Stage only intended changes. Use explicit paths rather than adding unrelated files just to run checks.
- Whole-module analyzers still inspect their own package inputs, not only the selected Git files.

### Check work before returning it

- Run the shared checks before returning changed Go code. Do not wait for a commit to trigger them.

```sh
set -eu
prek run --all-files
go build ./...
go test ./...
```

- Use the project's actual integration or end-to-end commands when fixtures, services, or artifact builds need additional setup.
- Run applicable [race and artifact checks](testing-and-performance.md) for concurrency and distribution changes.
- For dependency or security changes, also run `go tool govulncheck ./...` and inspect its findings.
- Fix findings at their cause, review formatter changes, and rerun the affected checks.

### Run the same checks in CI

- Check out the repository and install the selected Go toolchain and prek version before these commands.
- Run the following from the module root. Each failing command must fail the CI job.
- Let the checks fetch dependencies. Do not pre-run `go mod tidy` or `go mod download`, which can repair submitted metadata.

```sh
set -eu
prek run --all-files
go build ./...
go test ./...
go tool govulncheck ./...
```

- CI invokes the committed hook configuration directly. It does not need `prek install`.
- A formatter change fails CI rather than silently accepting unformatted submitted code.
- Run the project's real integration/e2e workflow and applicable race checks in addition to these commands.
- Make the CI job required for merging when the repository's protection rules support it.
- Hooks provide early feedback. CI remains necessary when hooks are missing or bypassed.
- Govulncheck uses known vulnerability data and the selected build configuration. Add scan tags and `-test` when those inputs need coverage.
- Inspect affected versions, symbols, and call paths before choosing a repair. A clean scan is not a general security proof.
- Use normal text output for this pass/fail scan. JSON, SARIF, and OpenVEX modes can return success while reporting vulnerabilities.

Sources: [prek in CI](https://prek.j178.dev/ci/) and [govulncheck usage, exit codes, and limitations](https://pkg.go.dev/golang.org/x/vuln/cmd/govulncheck).

## Example: a library and its command

- The module below uses `CountFile` from [errors and I/O](errors-and-io.md).
- `counts.go` contains that complete `package eventlog` example.
- The library owns parsing and file cleanup. The command owns presentation and process status.
- Embedded content travels with the binary; execution does not depend on the source checkout's working directory.

```text
eventlog/
  go.mod
  counts.go
  assets.go
  heading.txt
  cmd/
    eventcount/
      main.go
```

### `go.mod`

```gomod
module example.com/eventlog

go 1.27.3
```

### `heading.txt`

- Store `Event counts` followed by one newline.

### `assets.go`

- This file joins the `eventlog` package containing `CountFile`.

```go fragment
package eventlog

import _ "embed"

//go:embed heading.txt
var heading string

// Heading returns the report heading, including its terminating newline.
func Heading() string {
	return heading
}
```

### `cmd/eventcount/main.go`

- `run` returns before `os.Exit`, so deferred cleanup inside the operation can complete.
- JSON v2 needs an explicit deterministic option for sorted map keys. Its stream encoder terminates each value with a newline.
- Deterministic encoding is not a cross-build canonicalization guarantee. Use a specified canonical format when signatures or protocols require one.
- A parse failure emits no report. A write failure can leave partial output and still returns failure.

```go fragment
package main

import (
	"encoding/json/jsontext"
	"encoding/json/v2"
	"fmt"
	"io"
	"os"

	"example.com/eventlog"
)

// run preserves a failing exit status even when writing its diagnostic fails.
func run(args []string, stdout, stderr io.Writer) int {
	if len(args) != 1 {
		_, _ = fmt.Fprintln(stderr, "usage: eventcount FILE")
		return 2
	}
	counts, err := eventlog.CountFile(args[0])
	if err != nil {
		_, _ = fmt.Fprintln(stderr, err)
		return 2
	}
	if _, err := fmt.Fprint(stdout, eventlog.Heading()); err != nil {
		_, _ = fmt.Fprintln(stderr, err)
		return 2
	}
	encoder := jsontext.NewEncoder(stdout)
	if err := json.MarshalEncode(encoder, counts, json.Deterministic(true)); err != nil {
		_, _ = fmt.Fprintln(stderr, err)
		return 2
	}
	return 0
}

func main() {
	os.Exit(run(os.Args[1:], os.Stdout, os.Stderr))
}
```

- Sources: [`embed`](https://pkg.go.dev/embed), [`jsontext.Encoder`](https://pkg.go.dev/encoding/json/jsontext#Encoder), [`json.Deterministic`](https://pkg.go.dev/encoding/json/v2#Deterministic), [`os.Exit`](https://pkg.go.dev/os#Exit).

## Verify the artifact a caller receives

- Build the command and run it from an unrelated directory with a real input file.
- Verify output, diagnostics, exit status, and embedded resources through the binary rather than importing `main` internals.
- Compile a separate consumer against exported library APIs. This catches reliance on unexported state or workspace-only resolution.
- Use `GOWORK=off` and an explicit local replacement for a candidate source tree, then run that consumer's real workflows.
- For a versioned release, test `go install <module>/cmd/<command>@<version>` and a versioned library consumer where applicable.
- Versioned `go install` runs outside the current module's dependency context and has restrictions on replacement directives. Check its documented contract.
- Inspect `go version -m <binary>` when build provenance or toolchain identity matters.
- Exercise required platforms, architecture-specific files, build tags, and cgo paths. Cross-compilation alone does not prove runtime behavior.
- Do not assume `CGO_ENABLED=0` preserves a program that relies on cgo or a native driver.
- Keep release assets, generated files, and embedding patterns consistent with the actual module archive.
- Sources: [`go install`](https://pkg.go.dev/cmd/go#hdr-Compile_and_install_packages_and_dependencies), [module archives](https://go.dev/ref/mod#zip-files), [testing and performance](testing-and-performance.md).
