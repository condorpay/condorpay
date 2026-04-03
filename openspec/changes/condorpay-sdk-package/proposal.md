## Why

Developers integrating CondorPay today must install and wire up internal packages (`@condorpay/core`, `@condorpay/co`) manually. A single `condorpay` SDK package is needed to provide a one-install experience, a unified high-level client, and clean re-exports — removing friction and aligning with how modern payment SDKs (Stripe, MercadoPago) are consumed.

## What Changes

- New root `condorpay` npm package at `packages/sdk/`
- `CondorPay` main client class: instantiated with `{ country, ...config }`, exposes typed country-specific namespaces (`cp.breb`, `cp.wompi`)
- Full re-export of `@condorpay/core` public API from `condorpay`
- Full re-export of `@condorpay/co` public API from `condorpay/co`
- Subpath exports: `condorpay` (core + client), `condorpay/co` (Colombia full API)
- Dual ESM + CJS build via `tsc` (same pattern as `@condorpay/core` and `@condorpay/co`)
- Zero new runtime dependencies — only `@condorpay/core` and `@condorpay/co` as workspace deps

## Capabilities

### New Capabilities

- `sdk-main-client`: The `CondorPay` class — country-based initialization, typed namespace accessors for country-specific modules
- `sdk-exports`: Package entry points, re-exports, and subpath export configuration

### Modified Capabilities

## Impact

- New `packages/sdk/` Nx project added to the workspace
- `tsconfig.base.json` gains a path alias for `condorpay`
- `package.json` (root) workspace glob already covers `packages/*` — no change needed
- No breaking changes to `@condorpay/core` or `@condorpay/co`
