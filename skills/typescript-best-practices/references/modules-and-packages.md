# Modules and packages

## Match resolution to the code that loads modules

- The compiler predicts another system's loading behavior. Select that system before copying a `tsconfig`.
- ESM source syntax alone does not establish emitted format. File extensions, package metadata, compiler settings, and bundlers all matter.
- Use ESM for new work unless a supported consumer or deployment requires CommonJS.
- Preserve existing formats during unrelated changes. Adding `"type": "module"` can change every applicable `.js` file in a package.

| Execution or distribution | Configuration direction |
| --- | --- |
| Bun executes TypeScript directly | Bun's documented `module: "Preserve"`, `moduleResolution: "bundler"`, and `noEmit` setup. |
| Browser framework or bundler owns output | Its supported configuration, with bundler resolution and the correct browser libraries. |
| Node executes erasable TypeScript directly | Node-aware checking, `erasableSyntaxOnly`, type-only imports, and actual source extensions. |
| Compiled JavaScript runs directly in Node | Node-aware module mode, explicit output format, and runtime-compatible relative specifiers. |
| Unbundled package consumed by Node and bundlers | Node-aware checking, JavaScript output, and matching declarations. |
| Package restricted to Bun or a specific source-aware tool | Explicitly document and test that consumer contract. |

- `nodenext` tracks evolving Node semantics. Fixed modes such as `node20` suit deliberately fixed semantics when supported by the compiler.
- `target` controls emitted syntax, not runtime installation of APIs. `lib` supplies declarations, not polyfills.
- A browser target needs its actual browser support range or framework build target, not the developer's Bun version.
- Keep browser and server source in appropriate projects. Adding Bun or Node globals to browser files can hide deployment failures.
- Framework-specific generated types and checks remain necessary. Plain `tsc` cannot replace every framework's type pipeline.
- Native `node script.ts` strips erasable types without checking them. Node ignores `tsconfig.json` at runtime and does not support `.tsx`.
- Use `erasableSyntaxOnly` to catch unsupported transformed constructs. Keep actual `.ts` extensions in imports for source execution.
- A loader such as `tsx` and a compilation step provide different transformation contracts. Do not confuse either with native stripping.

## Make imports survive the build

- Use `import type` for type-only dependencies and `export type` for type-only re-exports.
- Use a separate side-effect import when module execution is required. A type-only import is erased.
- `verbatimModuleSyntax` makes that distinction explicit and catches incompatible module-syntax assumptions.
- Node ESM requires complete relative specifiers. In compiled TypeScript, `./inventory.js` can resolve to `inventory.ts` during checking.
- Direct `.ts` imports fit a source-executing host. Emitted JavaScript needs rewriting or compatible specifiers.
- `allowImportingTsExtensions` permits checking a syntax choice; it does not by itself rewrite imports for distribution.
- `rewriteRelativeImportExtensions` can rewrite supported relative TypeScript extensions during emit. Verify emitted dynamic imports and declarations too.
- `paths` tells TypeScript where to look. It does not automatically rewrite emitted JavaScript or teach the runtime an alias.
- Use real workspace dependencies, package exports, or runtime-supported package imports for cross-package boundaries.
- Avoid aliases that make local checking bypass the installed package interface.
- A bundler accepting an extensionless import does not prove Node can execute the published output.
- Circular dependencies can expose partially initialized bindings and order-sensitive side effects. Fix ownership rather than adding arbitrary import indirection.

## Keep the public package smaller than the repository

- Declare actual runtime dependencies under `dependencies`; keep tools under `devDependencies`.
- Use peer dependencies when consumers must supply a compatible shared host, such as a framework instance.
- Public declarations that import dependency types create a consumer dependency requirement too.
- Use package `exports` to define public entry points. Adding it to an established package can break deep imports.
- Put the `types` condition before runtime conditions. Conditional-export object order affects matching.
- Use a `files` allowlist to package the intended outputs. Inspect the archive for missing assets and accidental secrets.
- Make declarations describe the JavaScript actually shipped. Source-only success and correct `.d.ts` generation are separate claims.
- Do not add dual ESM/CommonJS builds unless consumers require both. Each format needs correct runtime and declaration resolution.
- If dual formats are required, check both consumers and shared-state behavior. Do not point both formats at mismatched declarations.
- Avoid publishing ambient const enums. Consumers can inline stale values or use incompatible isolated compilation.
- Keep package names, registry access, release versions, and publication credentials under explicit user control.

## Example: a small ESM library built with TypeScript

- This recipe ships unbundled JavaScript and declarations. It avoids unnecessary bundling for a small ordinary library.
- Start from the [tooling recipe](tooling.md). Bun manages dependencies; `tsc` builds the consumer artifact.
- The example uses ES2024 syntax and APIs. Its selected Node minimum must implement that contract.
- The package name is illustrative. Choose the real name and supported runtime range before publication.
- Complete source file, `src/index.ts`:

```ts
/** Returns a new array in descending numeric order without changing the input. */
export function descending(values: readonly number[]): number[] {
  return values.toSorted((left, right) => right - left);
}
```

- Complete `tsconfig.build.json`, independent of Bun's application configuration:

```json
{
  "compilerOptions": {
    "target": "ES2024",
    "lib": ["ES2024"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "verbatimModuleSyntax": true,
    "declaration": true,
    "noEmitOnError": true,
    "rootDir": "src",
    "outDir": "dist",
    "types": []
  },
  "include": ["src/**/*.ts"]
}
```

- Merge these fields into `package.json`. Keep the actual dependency and check-script fields from setup.

```json
{
  "name": "example-numeric-order",
  "version": "0.1.0",
  "type": "module",
  "files": ["dist"],
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "prepack": "bun run check && bun run build"
  }
}
```

- Keep `private: true` while building an unpublished application or private fixture. Remove it only when preparing an authorized release.
- Clean the project's owned output directory before release builds so deleted source files cannot survive as stale packaged outputs.
- For this recipe, from the package root: `rm -rf -- dist && bun run build`.
- Do not generalize that removal command to an arbitrary user-supplied path or a directory containing source files.

### Verify the tarball, not just the source tree

```sh
bun run check
rm -rf -- dist
bun run build
bun pm pack --dry-run
bun pm pack --filename package.tgz
```

- Create a separate consumer directory outside the checkout. Install the absolute path to `package.tgz` as a dependency.
- Do not use workspace aliases, source-path mappings, or symlinks to substitute source for the packed artifact.
- Complete consumer file, `consumer.ts`:

```ts
import { descending } from "example-numeric-order";

const input = [2, 10, 0];
const output = descending(input);
console.log(JSON.stringify({ input, output }));
```

- Type-check the consumer with strict settings and the promised TypeScript minimum.
- Compile it with Node-aware resolution, then run the emitted JavaScript with Node and Bun.
- Expect `{"input":[2,10,0],"output":[10,2,0]}`. Confirm that a string array is rejected by the public declaration.
- Add consumer checks for every public subpath, runtime condition, CLI entry, and asset the actual package promises.
- Use `publint` and Are the Types Wrong when package complexity warrants automated export and declaration analysis.
- Those analyzers supplement consumer execution. They do not prove all runtime behavior or semantic versioning compatibility.
- For a CLI, run the installed binary outside the checkout, including invalid arguments and file errors.
- Publish only after explicit authorization. Confirm registry, access level, version, archive contents, and successful consumer checks first.

## Version compatibility has several dimensions

- The development compiler determines which source syntax and checks the repository can use.
- The emitted JavaScript target and actual API usage determine runtime requirements.
- Published declaration syntax and type behavior determine the consumer's TypeScript requirements.
- A newer development compiler does not automatically require a newer runtime, but it can emit declarations older consumers cannot read.
- A lower `target` does not make new runtime APIs available and does not guarantee old declaration compatibility.
- Test the advertised minimum consumer compiler and runtime when shipping a library with that support claim.
- During upgrades, align package metadata, build targets, declarations, dependency versions, and CI with the approved range.

## Sources

- [TypeScript module-option guide](https://www.typescriptlang.org/docs/handbook/modules/guides/choosing-compiler-options.html): host-based resolution and library distribution hazards.
- [TypeScript module reference](https://www.typescriptlang.org/docs/handbook/modules/reference.html): paths, extension substitution, and resolution behavior.
- [Node package documentation](https://nodejs.org/api/packages.html): package formats, exports, imports, and condition order.
- [Node TypeScript execution](https://nodejs.org/api/typescript.html): native type stripping and its syntax and resolution limits.
- [TypeScript declaration publishing](https://www.typescriptlang.org/docs/handbook/declaration-files/publishing.html): distributed types and dependencies.
- [Bun TypeScript setup](https://bun.sh/docs/runtime/typescript) and [Bun pack](https://bun.sh/docs/pm/cli/pm): runtime configuration and archive commands.
- [publint](https://publint.dev/docs/) and [Are the Types Wrong](https://github.com/arethetypeswrong/arethetypeswrong.github.io): consumer-facing package analysis.
