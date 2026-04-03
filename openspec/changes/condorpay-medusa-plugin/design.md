## Context

`@condorpay/co` provides Bre-B QR generation (EMVCo payload + SVG, no external API call) and Wompi payment links + HMAC webhook validation. Neither has been integrated with Medusa v2 — merchants who need CondorPay payments in a Medusa store must write custom payment providers from scratch.

Medusa v2 uses `AbstractPaymentProvider` (from `@medusajs/framework/utils`) as the base for all payment integrations. Multiple provider services can live in one Nx package and register independently; each appears as a distinct payment method in Medusa admin and the storefront checkout. This change adds `packages/medusa/` publishing as `@condorpay/medusa`.

The four payment methods supported in Phase 1 are:
- **Bre-B QR** — push payment, customer scans QR at their bank app; instant and free.
- **Wompi card** — credit/debit card via Wompi payment link.
- **Wompi Nequi** — Nequi wallet via Wompi payment link.
- **Wompi PSE** — PSE bank transfer via Wompi payment link.

## Goals / Non-Goals

**Goals:**
- Four concrete Medusa provider classes: `CondorPayBrebProvider`, `CondorPayWompiCardProvider`, `CondorPayWompiNequiProvider`, `CondorPayWompiPseProvider`
- Store QR `payload` + `svg` in `PaymentSession.data` so storefronts can render the Bre-B QR code
- Webhook handling via `getWebhookActionAndData` using `validateWompiWebhook` from `@condorpay/co`
- Named exports per provider so merchants register only what they need
- Dual ESM + CJS build, same Nx pattern as `@condorpay/co`
- TypeScript 6, strict mode, zero `any`, peer dependencies only

**Non-Goals:**
- Refunds — Wompi v1 API does not expose a refund endpoint in Phase 1
- Saving payment methods / account holders — not needed for these payment methods
- Bre-B polling via an external status API — `@condorpay/co` has no Bre-B HTTP client
- Multiple webhook endpoints — one per Medusa module, Medusa routes internally

## Decisions

### Decision: One abstract Wompi base class, three concrete subclasses

`CondorPayWompiBaseProvider` is an abstract class that implements the shared Wompi logic: `initiatePayment` (creates a Wompi payment link via `WompiClient`), `capturePayment` (no-op; Wompi auto-captures), `getWebhookActionAndData` (HMAC validation + status mapping), and `retrievePayment` / `deletePayment` / `updatePayment` stubs.

Three concrete subclasses — `CondorPayWompiCardProvider`, `CondorPayWompiNequiProvider`, `CondorPayWompiPseProvider` — each set a distinct static `identifier`. This is the standard Medusa pattern for offering multiple payment methods from a single provider integration.

`CondorPayBrebProvider` is a fully independent class (no Wompi dependency for payment initiation) but uses `validateWompiWebhook` for its `getWebhookActionAndData` implementation because Bre-B payments in Colombia are settled through the Bancolombia/Wompi network and produce Wompi-format webhook events.

### Decision: Bre-B `initiatePayment` is a pure local operation

`CondorPayBrebProvider.initiatePayment` calls `generateQr` from `@condorpay/co` synchronously, assigns a synthetic `id` (`breb:<crypto.randomUUID()>`), and returns:

```ts
{
  id: "breb:<uuid>",
  data: { payload: string; svg: string; generatedAt: string },
  status: "pending"
}
```

No external HTTP call is made. The storefront reads `session.data.payload` and `session.data.svg` to render the QR. The synthetic ID is stored in Medusa's `PaymentSession` and passed to `getWebhookActionAndData` so Medusa can locate the session when the webhook arrives.

### Decision: `authorizePayment` returns `pending` for both Bre-B and Wompi

Neither payment method is authorized synchronously at the time `authorizePayment` is called. Authorization happens asynchronously via webhook. Returning `{ status: "pending", data }` tells Medusa to leave the session open; Medusa transitions the session to `authorized` when `getWebhookActionAndData` returns `PaymentActions.AUTHORIZED`.

### Decision: `capturePayment` is a no-op that echoes back the session data

Both Bre-B (push payment, already settled) and Wompi payment links (auto-captured by Wompi) do not need a separate capture step. Returning `{ data: input.data }` satisfies the interface and signals to Medusa that capture is complete.

### Decision: `refundPayment` throws `MedusaError` with type `NOT_ALLOWED`

Wompi v1 does not expose a refund endpoint. Throwing `MedusaError.Types.NOT_ALLOWED` is the idiomatic way to communicate that a payment action is not supported, and prevents Medusa admin from silently no-oping a refund request.

### Decision: Provider options use typed interfaces, not generic `Record`

```ts
interface BrebProviderOptions {
  wompi: WompiConfig;   // for webhook validation only
  breb?: BrebMerchantConfig;
}

interface WompiProviderOptions {
  wompi: WompiConfig;
}
```

Medusa's `AbstractPaymentProvider<TOptions>` generic accepts a typed options interface. Using typed interfaces enables type-safe config in `medusa-config.ts` and IDE autocompletion for merchants.

### Decision: Nx build follows the same dual-tsc pattern as `@condorpay/co`

No bundler is introduced. `tsconfig.esm.json` + `tsconfig.cjs.json` + `dist/cjs/package.json` injection via an inline `node -e` script. `project.json` defines `build`, `lint`, and `test` targets following the same structure as the `co` package.

## Risks / Trade-offs

- [Bre-B webhook uses Wompi event format] → Acceptable for Phase 1; Bre-B payments in Colombia flow through the Bancolombia/Wompi settlement network. If Bre-B gains a standalone webhook format, `CondorPayBrebProvider.getWebhookActionAndData` can be updated without affecting the Wompi providers.
- [No Bre-B payment status polling] → `getPaymentStatus` for Bre-B returns the stored `data.status`. Merchants who do not configure webhooks will not see payment completion. This is documented in the README and is a known limitation of Phase 1.
- [Synthetic Bre-B ID not stable across QR regeneration] → Each `initiatePayment` call produces a new UUID. Medusa stores this ID; the merchant must pass it through the Bre-B webhook payload (e.g., as `referenceLabel` in `additionalData`) so `getWebhookActionAndData` can match the session.
- [Medusa version coupling] → `@medusajs/framework` is a `peerDependency` targeting `>=2.5.0`. The `AbstractPaymentProvider` interface has been stable since v2.5.0. Breaking changes will require a major version bump.
