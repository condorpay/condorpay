## 1. Scaffold Package

- [x] 1.1 Create `packages/medusa/` directory with `package.json` (`name: "@condorpay/medusa"`, `version: "0.1.0"`, `type: "module"`)
- [x] 1.2 Add `@medusajs/framework` and `@condorpay/co` as `peerDependencies`; add both as `devDependencies` (`@condorpay/co` using `workspace:*`)
- [x] 1.3 Create `tsconfig.json` extending `../../tsconfig.base.json` with `paths: {}` override
- [x] 1.4 Create `tsconfig.esm.json` (`module: NodeNext`, `outDir: dist/esm`, `declarationDir: dist/types`)
- [x] 1.5 Create `tsconfig.cjs.json` (`module: CommonJS`, `ignoreDeprecations: "6.0"`, `outDir: dist/cjs`)
- [x] 1.6 Create `project.json` for Nx with `build`, `lint`, and `test` targets (mirror `@condorpay/co` pattern)
- [x] 1.7 Add path alias `@condorpay/medusa` to root `tsconfig.base.json`
- [x] 1.8 Add `exports` map to `package.json`: `"."` → main index, `"./breb"` → Bre-B entry, `"./wompi"` → Wompi entry (each with ESM/CJS/types)
- [x] 1.9 Add build script: `tsc -p tsconfig.esm.json && tsc -p tsconfig.cjs.json && node -e "...writeFileSync('dist/cjs/package.json', ...)"` to inject `{"type":"commonjs"}`
- [x] 1.10 Create `vitest.config.ts` (same pattern as `@condorpay/co`)

## 2. Types and Shared Utilities

- [x] 2.1 Create `src/types.ts` — `BrebProviderOptions` interface (`wompi: WompiConfig`, `breb?: BrebMerchantConfig`) and `WompiProviderOptions` interface (`wompi: WompiConfig`)
- [x] 2.2 Create `src/webhook-utils.ts` — helper `mapWompiEventToMedusaAction(event: WompiWebhookEvent): PaymentActions` that maps `APPROVED` → `AUTHORIZED`, `DECLINED|VOIDED|ERROR` → `FAILED`, else `NOT_SUPPORTED`

## 3. Bre-B Provider

- [x] 3.1 Create `src/breb/breb-provider.ts` — `CondorPayBrebProvider` class extending Medusa `AbstractPaymentProvider<BrebProviderOptions>` with `static identifier = "condorpay-breb"`
- [x] 3.2 Implement `initiatePayment`: call `generateQr` from `@condorpay/co`, assign `id = "breb:" + crypto.randomUUID()`, return `{ id, status: "pending", data: { payload, svg, generatedAt } }`; throw `MedusaError.INVALID_DATA` if no `breb` config is present in options
- [x] 3.3 Implement `authorizePayment`: return `{ status: "pending", data: input.data }` (authorization is async via webhook)
- [x] 3.4 Implement `capturePayment`: return `{ data: input.data }` (no-op; Bre-B is a push payment, already settled)
- [x] 3.5 Implement `getPaymentStatus`: read `input.data.status`; return `{ status: input.data.status ?? "pending", data: input.data }`
- [x] 3.6 Implement `getWebhookActionAndData`: parse body as `WompiWebhookEvent`, call `validateWompiWebhook`; on success map status to action using `mapWompiEventToMedusaAction`; on failure return `NOT_SUPPORTED`
- [x] 3.7 Implement `refundPayment`: throw `MedusaError` with `MedusaError.Types.NOT_ALLOWED`
- [x] 3.8 Implement `retrievePayment`, `updatePayment`, `deletePayment`, `cancelPayment` as stubs returning `{ data: input.data }`
- [x] 3.9 Create `src/breb/index.ts` — export `CondorPayBrebProvider` and `BrebProviderOptions`
- [x] 3.10 Create `src/breb-entry.ts` — re-export from `./breb/index.js`

## 4. Wompi Provider

- [x] 4.1 Create `src/wompi/wompi-base-provider.ts` — `CondorPayWompiBaseProvider` abstract class extending Medusa `AbstractPaymentProvider<WompiProviderOptions>`; constructor initializes `WompiClient` from options
- [x] 4.2 Implement `initiatePayment`: validate `currency_code === "cop"` (case-insensitive); call `WompiClient.createPaymentLink` with `singleUse: true`; return `{ id: link.id, status: "pending", data: { wompiId: link.id, wompiUrl: link.url } }`
- [x] 4.3 Implement `authorizePayment`: return `{ status: "pending", data: input.data }` (authorization is async via webhook)
- [x] 4.4 Implement `capturePayment`: return `{ data: input.data }` (no-op; Wompi auto-captures)
- [x] 4.5 Implement `retrievePayment`: call `WompiClient.getPaymentLink(input.data.wompiId)`; return `{ data: { ...link } }`
- [x] 4.6 Implement `getPaymentStatus`: call `WompiClient.getPaymentLink`; map `ACTIVE` → `pending`, `INACTIVE` → `authorized`, `EXPIRED` → `canceled`
- [x] 4.7 Implement `getWebhookActionAndData`: parse body as `WompiWebhookEvent`, call `validateWompiWebhook`; map status to action; extract `session_id` from `transaction.reference` and `amount` from `transaction.amountInCents / 100`
- [x] 4.8 Implement `refundPayment`: throw `MedusaError` with `MedusaError.Types.NOT_ALLOWED`
- [x] 4.9 Implement `updatePayment`: return `{ status: "pending", data: input.data }` (payment link amount cannot be updated)
- [x] 4.10 Implement `deletePayment` and `cancelPayment`: return `{ data: input.data }` (Wompi links expire automatically)
- [x] 4.11 Create `CondorPayWompiCardProvider`, `CondorPayWompiNequiProvider`, `CondorPayWompiPseProvider` in `src/wompi/` — each extends `CondorPayWompiBaseProvider` and sets its own `static identifier`
- [x] 4.12 Create `src/wompi/index.ts` — export base class, all three concrete classes, and `WompiProviderOptions`
- [x] 4.13 Create `src/wompi-entry.ts` — re-export from `./wompi/index.js`

## 5. Package Index

- [x] 5.1 Create `src/index.ts` — export `CondorPayBrebProvider`, `BrebProviderOptions`, `CondorPayWompiCardProvider`, `CondorPayWompiNequiProvider`, `CondorPayWompiPseProvider`, `WompiProviderOptions`

## 6. Tests

- [x] 6.1 Create `src/breb/breb-provider.test.ts` — test `initiatePayment` returns QR `payload` and `svg` in data; test `id` matches `breb:<uuid>` pattern; test `initiatePayment` throws when no `breb` config; test `authorizePayment` returns `pending`; test `capturePayment` is a no-op
- [x] 6.2 Create `src/breb/breb-provider-webhook.test.ts` — test `getWebhookActionAndData` with valid approved event returns `AUTHORIZED`; test declined event returns `FAILED`; test tampered HMAC returns `NOT_SUPPORTED`; test `refundPayment` throws `NOT_ALLOWED`
- [x] 6.3 Create `src/wompi/wompi-base-provider.test.ts` — test `initiatePayment` calls `WompiClient.createPaymentLink` and returns correct data; test non-COP currency throws; test `capturePayment` is no-op; test `authorizePayment` returns pending; test `getPaymentStatus` mapping for ACTIVE/INACTIVE/EXPIRED
- [x] 6.4 Create `src/wompi/wompi-base-provider-webhook.test.ts` — test `getWebhookActionAndData` with valid approved event returns `AUTHORIZED` with correct `session_id` and `amount`; test declined returns `FAILED`; test invalid HMAC returns `NOT_SUPPORTED`; test `refundPayment` throws `NOT_ALLOWED`
- [x] 6.5 Create `src/wompi/wompi-providers.test.ts` — verify `CondorPayWompiCardProvider.identifier === "condorpay-wompi-card"`, same for Nequi and PSE

## 7. Build Validation

- [x] 7.1 Run `pnpm exec biome check --write --unsafe packages/medusa/src` and fix all lint errors
- [x] 7.2 Run `pnpm nx lint medusa` and confirm zero errors
- [x] 7.3 Run `pnpm nx build medusa` and confirm zero TypeScript errors
- [x] 7.4 Run `pnpm nx test medusa` and confirm all tests pass
- [x] 7.5 Run `pnpm nx run-many -t build` to confirm all packages still build together
