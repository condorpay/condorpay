## 1. Scaffold Package

- [x] 1.1 Create `packages/sdk/` directory with `package.json` (`name: "condorpay"`, `version: "0.1.0"`, `type: "module"`)
- [x] 1.2 Add `@condorpay/core` and `@condorpay/co` as `dependencies` using `workspace:*`
- [x] 1.3 Create `tsconfig.json` extending `../../tsconfig.base.json` with `paths: {}` override
- [x] 1.4 Create `tsconfig.esm.json` (`module: NodeNext`, `outDir: dist/esm`, `declarationDir: dist/types`)
- [x] 1.5 Create `tsconfig.cjs.json` (`module: CommonJS`, `ignoreDeprecations: "6.0"`, `outDir: dist/cjs`)
- [x] 1.6 Create `project.json` for Nx with `build`, `lint`, and `test` targets
- [x] 1.7 Add path alias `condorpay` to root `tsconfig.base.json`

## 2. Source Files

- [x] 2.1 Create `src/client.ts` — `CondorPay` class with discriminated union config (`country: "co"`) and `co` accessor returning `CondorPayCo`
- [x] 2.2 Create `src/index.ts` — re-export everything from `@condorpay/core` plus `CondorPay` and its config types
- [x] 2.3 Create `src/co-entry.ts` — re-export everything from `@condorpay/co`

## 3. Package Exports

- [x] 3.1 Add `exports` map to `package.json`: `"."` → ESM/CJS/types for `src/index.ts`, `"./co"` → ESM/CJS/types for `src/co-entry.ts`
- [x] 3.2 Set `main`, `module`, and `types` fields in `package.json` for legacy resolution
- [x] 3.3 Add build script: `tsc -p tsconfig.esm.json && tsc -p tsconfig.cjs.json && node -e "...writeFileSync('dist/cjs/package.json', ...)"` to inject `{"type":"commonjs"}`

## 4. Tests

- [x] 4.1 Create `vitest.config.ts` (same pattern as `@condorpay/co`)
- [x] 4.2 Create `src/client.test.ts` — test `CondorPay` instantiation with `country: "co"`, verify `cp.co` is `CondorPayCo` instance
- [x] 4.3 Test `cp.co.generateQr(...)` returns `BrebQrResult` with `payload` and `svg`
- [x] 4.4 Test re-exports: verify `Currency`, `PaymentStatus`, `CondorPayError` are importable from the SDK index
- [x] 4.5 Test `condorpay/co` subpath re-exports: verify `CondorPayCo`, `WompiPaymentLinkStatus` are accessible

## 5. Build Validation

- [x] 5.1 Run `pnpm nx build sdk` and confirm zero TypeScript errors
- [x] 5.2 Run `pnpm nx test sdk` and confirm all tests pass
- [x] 5.3 Run `pnpm nx run-many -t build` to confirm all packages still build together
