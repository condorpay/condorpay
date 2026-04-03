## ADDED Requirements

### Requirement: Package scaffold exists at `packages/medusa/`
A new Nx project SHALL exist at `packages/medusa/` with `package.json` (`name: "@condorpay/medusa"`, `version: "0.1.0"`, `type: "module"`), an Nx `project.json`, and all TypeScript config files following the same dual ESM + CJS pattern as `@condorpay/co`.

#### Scenario: Package has correct name and version
- **WHEN** `packages/medusa/package.json` is read
- **THEN** `name` is `"@condorpay/medusa"` and `version` is `"0.1.0"`

#### Scenario: Nx recognizes the medusa project
- **WHEN** `pnpm nx show project medusa` is run
- **THEN** the project is listed with `build`, `lint`, and `test` targets

### Requirement: Peer dependencies are `@medusajs/framework` and `@condorpay/co`
The package SHALL declare `@medusajs/framework` and `@condorpay/co` as `peerDependencies` and as `devDependencies` (using `workspace:*` for `@condorpay/co`). Zero new runtime dependencies are added.

#### Scenario: No runtime dependencies other than peers
- **WHEN** `packages/medusa/package.json` `dependencies` field is inspected
- **THEN** the field is absent or empty — all deps are `peerDependencies` or `devDependencies`

### Requirement: Dual ESM + CJS build produces correct outputs
Running `pnpm nx build medusa` SHALL produce `dist/esm/` (ESM with `.d.ts` declarations) and `dist/cjs/` (CJS with injected `{"type":"commonjs"}` in `dist/cjs/package.json`).

#### Scenario: ESM output exists after build
- **WHEN** `pnpm nx build medusa` completes successfully
- **THEN** `packages/medusa/dist/esm/index.js` and `packages/medusa/dist/esm/index.d.ts` exist

#### Scenario: CJS output has type injection
- **WHEN** `pnpm nx build medusa` completes successfully
- **THEN** `packages/medusa/dist/cjs/package.json` contains `{"type":"commonjs"}`

### Requirement: `package.json` exports map covers all four providers
The `exports` field SHALL include `"."` (main index) plus individual subpath exports for each provider so merchants can import only what they need.

#### Scenario: Bre-B provider importable via subpath
- **WHEN** a TypeScript project does `import { CondorPayBrebProvider } from "@condorpay/medusa/breb"`
- **THEN** the import resolves to the correct ESM or CJS output with full types

#### Scenario: Wompi providers importable via subpath
- **WHEN** `import { CondorPayWompiCardProvider } from "@condorpay/medusa/wompi"` is used
- **THEN** the import resolves correctly with full types

### Requirement: Path alias `@condorpay/medusa` added to root `tsconfig.base.json`
The root `tsconfig.base.json` SHALL include a `paths` entry for `@condorpay/medusa` pointing to `packages/medusa/src/index.ts` so other packages and apps in the monorepo can import it without building first.

#### Scenario: TypeScript resolves `@condorpay/medusa` in monorepo
- **WHEN** a TypeScript file in the monorepo imports from `"@condorpay/medusa"`
- **THEN** the TypeScript compiler resolves to `packages/medusa/src/index.ts` without errors
