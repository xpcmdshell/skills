# Tooling

## Select versions deliberately

- The current stable teaching target is TypeScript 7.0.2. The Bun-first setup uses Bun 1.4.4.
- Recheck official stable releases and dependency compatibility when creating a project. Do not select prereleases from a newer-looking tag.
- Keep runtime, development compiler, compiler-API consumers, and public declaration compatibility separate.
- Preserve the existing stack during unrelated work. Ask before installing or upgrading global tools.
- Pin the selected Bun version for the project and CI. Commit `package.json` and `bun.lock`.
- Use a supported Node version for Node-based development tools. Node 24 LTS is a suitable choice for the recipe below.
- ESLint 10 requires Node `^20.19.0 || ^22.13.0 || >=24`. Bun-first does not mean every development tool must execute under Bun.

| Modernization choice | When it fits |
| --- | --- |
| TypeScript 7.0.2 and Bun 1.4.4 | New Bun-first projects and compatible existing dependencies. |
| TypeScript 6.0.3 compiler/API track | A framework, plugin, or tool requires the older compiler API. Verify that tool's documented support. |
| Compiler/tool upgrade with retained runtime minimum | Existing consumers still need the older runtime. Verify emitted syntax and API use. |
| Existing supported runtime and package manager | Unrelated maintenance or deployment constraints do not justify migration. |

- TypeScript 6 is a compatibility choice, not an LTS promise. Do not assume older tools will accept it either.
- Once the user chooses a target, align dependencies, configuration, editor service, CI, and support documentation.
- Preserve only the compatibility paths still required by the approved support range.

## Handle the TypeScript 7 compiler API transition

- TypeScript 7 supplies a native compiler, but not the legacy JavaScript compiler API used by current typescript-eslint.
- Current typescript-eslint 8.72.1 declares TypeScript support `>=4.8.4 <6.1.0`.
- Use Microsoft's documented aliases when combining TypeScript 7 checking with these API-dependent tools.
- `@typescript/native` below installs stable TypeScript 7 and supplies `tsc`.
- The `typescript` alias supplies the supported compatibility API and `tsc6`.
- The compatibility package's version and underlying compiler version differ. Let the lockfile preserve the resolved dependency graph.
- Do not replace the bridge with a prerelease API merely because its version is newer.
- Revisit the aliases when dependent tools officially support the new API. Do not retain them as unexplained permanent scaffolding.

## Initialize a Bun application

- Prerequisites: Bun 1.4.4, a supported Node installation, and Git when using hooks.
- Use the installed versions until an upgrade is approved. An isolated project can use a separately installed runtime without changing global tools.
- Start in a new project directory with this `package.json`. Replace the illustrative name with the project name.

```json
{
  "name": "example-typescript-app",
  "private": true,
  "type": "module",
  "packageManager": "bun@1.4.4"
}
```

- Install the selected toolchain and create the source directories:

```sh
bun add --dev --exact \
  '@typescript/native@npm:typescript@7.0.2' \
  'typescript@npm:@typescript/typescript6@6.0.2' \
  '@types/bun@1.4.4' \
  'eslint@10.13.0' '@eslint/js@10.0.1' \
  'typescript-eslint@8.72.1' \
  'prettier@3.9.10' 'eslint-config-prettier@10.1.8'
mkdir -p src tests
```

- Applications do not need a TypeScript peer dependency. Keep compiler and compiler-API dependencies in the declared development toolchain.
- If adapting a generated manifest, reconcile its TypeScript peer requirements before installing the aliases.
- The configuration below checks `src` and `tests`. Keep the entry point inside that checked source tree.
- Add domain dependencies as needed. For the validation example, run `bun add zod`.
- Do not add a schema dependency to a project with no runtime validation need.
- Complete Bun application `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2024",
    "lib": ["ES2024"],
    "module": "Preserve",
    "moduleResolution": "bundler",
    "moduleDetection": "force",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "types": ["bun"]
  },
  "include": ["src/**/*.ts", "tests/**/*.ts"]
}
```

- This is a server/script configuration. For TSX, browser, worker, or framework code, use the host's supported JSX, library, and include settings.
- Use separate TSConfig projects for materially different environments rather than making every global available everywhere.
- ES2024 is an explicit runtime contract supported by the selected Bun. It is not a recommendation for arbitrary browser deployments.
- `strict` is explicit despite newer compiler defaults. The two presence-related flags are separate from strict mode.
- Do not enable `skipLibCheck` reflexively to hide conflicting declarations. Resolve dependency and environment problems first.
- Do not copy removed compiler flags from older templates. Check TypeScript 6/7 migration guidance for the chosen compiler.

## Configure typed linting and formatting

- Copy the bundled [antipattern rules](../assets/antipattern-rules.mjs) into the project so checks do not depend on an agent's installation.
- Set `SKILL_DIR` to the absolute directory containing this skill's `SKILL.md`. Then run from the project root:

```sh
mkdir -p eslint
cp "$SKILL_DIR/assets/antipattern-rules.mjs" eslint/antipattern-rules.mjs
```

- Commit the copied configuration with the project's ESLint configuration.
- Complete `eslint.config.mjs`:

```js
import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier/flat";
import antipatternRules, { testRules } from "./eslint/antipattern-rules.mjs";

export default defineConfig(
  { ignores: ["dist/**", "coverage/**"] },
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    extends: [js.configs.recommended, tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      ...antipatternRules,
      "@typescript-eslint/no-floating-promises": [
        "error",
        { ignoreVoid: false },
      ],
      "@typescript-eslint/return-await": [
        "error",
        "error-handling-correctness-only",
      ],
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
  {
    files: ["tests/**/*.{ts,tsx,mts,cts}"],
    rules: testRules,
  },
  prettier,
);
```

- `recommendedTypeChecked` catches unsafe `any` propagation and misused promises beyond ordinary compiler checks.
- The bundled preset requires typed linting, strict null checks, and `noUncheckedIndexedAccess`.

| Rule | Detects | Does not establish |
| --- | --- | --- |
| `no-unnecessary-condition` with `checkTypePredicates: true` | Redundant nullish defaults, optional chains, and recognized predicate checks. | Every redundant `typeof` comparison or whether upstream types are honest. |
| `no-unnecessary-type-conversion` | Coercions such as `String(id)` when `id` is already a string. | Whether coercing unknown input satisfies domain policy. |
| `no-unnecessary-type-assertion` | Assertions that do not change the expression's type. | Whether a type-changing assertion is justified. |

- Constant literal loops remain permitted; they can express intentional service loops.
- The `testRules` override disables only predicate-call checking in tests. Match it to the project's actual test locations.
- Type-compatible values are not necessarily equal. A meaningful `assert.equal` can trigger predicate checking despite testing a real invariant.
- Preserve runtime invariants in application code or adapters with a focused suppression explaining the required value check.
- Never weaken behavioral assertions to satisfy typed lint. See [antipatterns](antipatterns.md#use-linting-for-properties-it-can-establish) for manual review obligations.
- Do not weaken types to satisfy these rules. Fix the responsible contract or explain a genuine checker limitation with a focused suppression.
- `ignoreVoid: false` prevents using `void` as an unhandled-rejection escape. Deliberate detached work still needs an explicit owner.
- `return-await` protects error and disposal boundaries without imposing an unrelated style rule everywhere.
- Keep linted TypeScript files in their intended TSConfig projects. Add appropriate configuration for JavaScript files when they need linting.
- Review stronger `strictTypeChecked` rules before adopting them. More diagnostics do not automatically make an API better.
- Run Prettier separately. The final ESLint configuration disables conflicting stylistic rules rather than running formatting inside ESLint.
- Complete `.prettierignore` for this output layout:

```text
node_modules/
dist/
coverage/
bun.lock
*.tgz
```

- Put these scripts in `package.json`, preserving the other manifest fields:

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --max-warnings 0",
    "format:check": "prettier --check .",
    "format": "prettier --write .",
    "test": "bun test",
    "check": "bun run typecheck && bun run lint && bun run format:check && bun run test"
  }
}
```

- `tsc --noEmit` uses the project's pinned stable compiler. Check `bunx --no-install tsc --version` after setup.
- Plain execution, transpilation, tests, or bundling do not type-check automatically.
- Bun 1.4.4 also offers `bun check --no-script`. The flag bypasses this project's similarly named `check` script.
- Its checker is bundled with Bun rather than selected by the installed compiler. Inspect `bun -p process.versions.typescript`.
- Bun can include checker changes beyond that version's upstream release. Keep `tsc` authoritative when exact compiler agreement matters.
- `bun test --check` checks test entry points and their imports. It does not replace a whole-project check of unimported source.
- Use `tsc` for declaration or JavaScript emit. Bun's built-in checker emits neither.
- Add real feature integration tests before expecting the complete check to pass. Do not enable pass-with-no-tests to hide missing behavior checks.
- Repair formatting with `bun run format`; inspect the diff, then rerun `bun run check`.

### Align the editor with the compiler

- Check the editor's reported TypeScript version, not just its workspace-package setting.
- In this alias arrangement, `node_modules/typescript` is the API bridge, not the native TypeScript 7 compiler.
- Use the editor's supported native TypeScript service and point it at `node_modules/@typescript/native` when configurable.
- Microsoft's TypeScript 7 VS Code extension documents `js/ts.experimental.useTsgo` and `js/ts.tsdk.path` for this selection.
- Framework language-service plugins may require a different supported service. Follow their compatibility instructions instead of forcing the native service.

## Install hooks and run independent CI

- Keep a suitable existing hook manager. For new setup, prek provides a shared project-wide check without adding another Node hook dependency.
- Install prek using its [supported installation instructions](https://prek.j178.dev/installation/) when unavailable.
- Complete `.pre-commit-config.yaml`:

```yaml
repos:
  - repo: local
    hooks:
      - id: typescript-check
        name: TypeScript checks
        language: system
        entry: bun run check
        pass_filenames: false
        always_run: true
```

- Install the hook in each clone, from the repository root:

```sh
prek install
prek run --all-files
```

- Whole-project checking catches changes to configuration, imports, and deleted files. Do not pass staged filenames to `tsc`.
- The hook checks formatting without modifying or staging files. Review repairs and restage them yourself.
- After setup, [verify hook and CI enforcement](verification-and-performance.md#verify-hooks-and-ci-independently), including bypassed hooks.
- Agent instructions should require `bun run check` before returning changed code. Hooks and CI cover separate later boundaries.
- On GitHub Actions, use a standard hosted runner and provision the pinned Bun plus a supported Node version.
- The shared CI commands are:

```sh
bun install --frozen-lockfile
bun run check
```

- Complete `.github/workflows/check.yml`:

```yaml
name: Check
on: [push, pull_request]
permissions:
  contents: read
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v4
        with:
          node-version: "24"
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: "1.4.4"
      - run: bun install --frozen-lockfile
      - run: bun run check
```

- Follow the repository's action-pinning policy. Update action revisions through its dependency workflow.
- CI runs independently of hook installation. Add actual build and packed-consumer checks for distributed packages.
- Use independent steps or `&&` chaining so later successful commands cannot hide earlier failures.

## Offer alternatives for a concrete benefit

| Alternative | Useful reason to consider it | Check before migration |
| --- | --- | --- |
| Bun's `fmt` | Integrated formatting in Bun 1.4.4 | Output differences, configuration, and required format/plugin support. |
| Biome | Integrated formatting and linting | Rule coverage, framework support, and differences from full typed ESLint checks. |
| Oxlint with `oxlint-tsgolint` | Fast linting with native type-aware rules | Required rule/plugin coverage and TypeScript 7-compatible configuration. |
| Vitest | Vite or browser/framework integration | Actual execution environment and existing tests. |
| publint and Are the Types Wrong | Package export and declaration checks | Distribution formats and supported consumer profiles. |

- Keep a dedicated type checker when adopting a linter. Biome's inference is not a replacement for full TypeScript checking.
- Oxlint's type-aware mode needs its type-information package. Syntax-only linting does not establish typed-rule coverage.
- Bun's documented linter is canary-only at this stable target. Do not install a stable project expecting `bun lint` to work.
- Do not stack overlapping linters by default. Compare the existing workflow's capabilities before adding another tool.
- Explain benefits, missing capabilities, migration diffs, and compatibility. Obtain approval before replacing existing tools.

### Offer cognitive-complexity reporting

- During tooling setup, offer cccc as optional readability feedback. Start with an ungated report:

```sh
cccc --no-config --table src
```

- Confirm source scope, syntax coverage, exclusions, failure policy, and whether enforcement belongs in hooks, CI, or both.
- Preserve existing policy. If a threshold is requested but unspecified, propose 15 per function from cccc's documented examples.
- Do not enable that threshold without approval. A score is not proof that a function is understandable.
- After approval, configure `languages = ["es"]` and the accepted `max-cognitive` in `cccc.toml`.
- Run `cccc --config cccc.toml src` at the selected boundaries. Do not silently gate cyclomatic complexity too.
- In GitHub Actions, `moznion/cccc-action` can install cccc before the shared check or run the chosen source path.
- Inspect parser diagnostics and analyzed-file coverage. Recovered partial parses can produce incomplete successful reports.
- Refactor only when responsibilities and control flow become clearer. Do not fragment coherent code to satisfy a score.

## Manage dependencies and releases

- Use frozen-lockfile installation in CI. Update manifest and lockfile together through reviewed dependency changes.
- Use `bun audit` for known advisory checks. A clean report is not proof that dependencies are trustworthy.
- Review dependency lifecycle scripts before trusting them. Scope `trustedDependencies` to justified packages rather than enabling everything.
- An explicit trusted-dependency list changes Bun's default trust behavior. Check the current documentation before modifying it.
- Read [modules and packages](modules-and-packages.md) before building a distributable library or command.
- Use `bun pm pack --dry-run` to inspect archive preparation without publishing. A publish dry-run can still require registry authentication.
- Publish a previously checked tarball only after authorization, with the intended registry, version, and access level.
- Bun 1.4.4 does not generate npm provenance. Use npm's supported OIDC/provenance workflow when the release contract requires it.

## Sources

- [TypeScript 7 announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/): native compiler and official compatibility aliases.
- [typescript-eslint supported dependencies](https://typescript-eslint.io/users/dependency-versions) and [typed linting](https://typescript-eslint.io/getting-started/typed-linting): supported APIs and Project Service.
- [Bun 1.4.4 release](https://bun.com/blog/bun-v1.4.4), [type checking](https://bun.com/docs/runtime/check), and [TypeScript migration](https://bun.com/docs/typescript-6): built-in checking and compiler differences.
- [Prettier with linters](https://prettier.io/docs/integrating-with-linters): separate formatting and lint responsibilities.
- [Bun formatting](https://bun.com/docs/format), [Bun lint status](https://bun.com/docs/lint), [Biome comparison](https://biomejs.dev/introduction/comparison-with-other-tools/), and [Oxlint typed linting](https://oxc.rs/docs/guide/usage/linter/type-aware.html): alternatives and limits.
- [prek local hooks](https://prek.j178.dev/local-hooks/) and [setup-bun](https://github.com/oven-sh/setup-bun): hook execution and CI provisioning.
- [cccc](https://github.com/moznion/cccc) and [cccc-action](https://github.com/moznion/cccc-action): optional complexity analysis and parser diagnostics.
- [Bun lifecycle trust](https://bun.com/docs/pm/lifecycle), [audit](https://bun.com/docs/pm/cli/audit), and [publishing](https://bun.com/docs/pm/cli/publish): dependency and release behavior.
- [Microsoft TypeScript 7 extension](https://marketplace.visualstudio.com/items?itemName=TypeScriptTeam.native-preview): editor service selection.
