## Context

`@condorpay/core` provides base types and the abstract provider. `@condorpay/co` provides the Colombia implementation (Wompi payment links, Bre-B QR). Both are published as scoped packages. Today there is no top-level `condorpay` package — users must install and configure internal packages directly.

The SDK package (`packages/sdk/`) will be the single public-facing package. It wraps the internal packages, provides a high-level `CondorPay` client, and re-exports the full public API so users never need to install internal packages themselves.

Build system is Nx with pnpm workspaces. Both existing packages use dual ESM+CJS via two `tsc` invocations; the SDK package follows the same pattern.

## Goals / Non-Goals

**Goals:**
- Single `npm install condorpay` gives access to the full SDK
- `CondorPay` client class for country-based initialization and typed namespace access
- Re-export all public APIs from `@condorpay/core` and `@condorpay/co`
- Subpath export `condorpay/co` for tree-shakeable imports
- TypeScript types work without separate `@types/*` install
- Dual ESM + CJS output, same as existing packages

**Non-Goals:**
- Runtime country detection (always explicit `{ country: "co" }`)
- Lazy/dynamic loading of country modules
- Any new payment logic — SDK is purely a composition layer
- Browser bundle (UMD/IIFE) — Node.js and bundler-friendly ESM/CJS only

## Decisions

### Decision: Single `packages/sdk/` package, not a monorepo meta-package
Re-exporting from a dedicated package (not the workspace root) keeps the published artifact clean, allows independent versioning, and mirrors how other multi-country SDKs (e.g., Stripe Node.js SDK) work. Workspace root `package.json` is not publishable in this setup.

### Decision: `CondorPay` class uses discriminated union config, not generics
```typescript
type CondorPayConfig =
  | { country: "co"; wompi: WompiConfig; breb?: BrebMerchantConfig }

class CondorPay {
  constructor(config: CondorPayConfig)
  readonly co: CondorPayCo   // only present when country === "co"
}
```
Using a discriminated union (over generics like `CondorPay<"co">`) gives better IDE autocompletion and avoids type gymnastics. The trade-off is that adding a new country requires adding a union member and a new accessor — acceptable since country additions are infrequent.

### Decision: Namespace accessors use the concrete country class directly
`cp.co` returns `CondorPayCo` (not a custom namespace object). This means all methods of `CondorPayCo` — including `generateQr`, `createPayment`, `getPayment`, `cancelPayment` — are accessible without an extra wrapper layer. Simpler and easier to document.

### Decision: Subpath export `condorpay/co` re-exports `@condorpay/co` barrel
The `condorpay/co` subpath re-exports everything from `@condorpay/co`. This lets tree-shaking bundlers drop the Colombia module if unused, and gives power users direct access to `CondorPayCo` and Wompi/Bre-B types without going through the main client.

### Decision: Dual ESM + CJS via two `tsc` invocations (same as core/co)
Avoids introducing a bundler (esbuild, rollup) into the build pipeline. The `dist/cjs/package.json` injection trick for Node.js CJS resolution is already proven in the other packages. SDK follows the same pattern exactly.

### Decision: `@condorpay/core` and `@condorpay/co` as `dependencies`, not `peerDependencies`
The SDK is the public entry point — users shouldn't need to install internal packages separately. Using `dependencies` means npm/pnpm installs them automatically. For the workspace, `workspace:*` protocol links to local packages.

## Risks / Trade-offs

- [Version skew between SDK and internal packages] → Mitigated by `workspace:*` protocol during development; CI build validates all packages build together before publish.
- [Re-exporting everything from co increases bundle size for web apps] → Mitigated by `condorpay/co` subpath export enabling tree-shaking; main `condorpay` entry still re-exports core + client only.
- [Adding new countries requires SDK changes] → Accepted trade-off; the discriminated union approach makes additions mechanical and type-safe.
