## Why

Medusa v2 merchants in Colombia have no official CondorPay payment plugin — they must write custom payment providers by hand. An official `@condorpay/medusa` package gives any Medusa v2 store instant access to Bre-B QR and Wompi payment methods with a single install and zero migrations.

## What Changes

- New `packages/medusa/` package: `@condorpay/medusa`
- `CondorPayBrebProvider` — Medusa `AbstractPaymentProvider` for Bre-B QR; stores QR payload + SVG in `PaymentSession.data` so storefronts can render the code
- `CondorPayWompiProvider` — shared Medusa `AbstractPaymentProvider` base for Wompi; subclassed once per method type (card, Nequi, PSE) so each appears as a distinct checkout option in Medusa admin
- `getWebhookActionAndData` on both providers translating Wompi webhook events into Medusa payment actions (`authorized` / `failed`)
- Webhook validation using the existing `validateWompiWebhook` HMAC helper from `@condorpay/co`
- Package exports each provider as a separate Medusa module entry so merchants only register what they need
- Peer dependencies: `@medusajs/framework`, `@condorpay/co`; zero new runtime dependencies

## Capabilities

### New Capabilities

- `medusa-breb-provider`: Bre-B QR payment provider — `initiatePayment` generates QR, `getPaymentStatus` polls Bre-B payment status, `getWebhookActionAndData` handles payment approval
- `medusa-wompi-provider`: Wompi payment providers (card, Nequi, PSE) — `initiatePayment` creates a Wompi payment link, `getWebhookActionAndData` translates Wompi events to Medusa actions, shared abstract base class with three concrete subclasses per method type
- `medusa-package-setup`: Package scaffolding — `package.json`, tsconfigs, Nx `project.json`, per-provider module entry files, TypeScript 6 dual ESM+CJS build

### Modified Capabilities

## Impact

- New `packages/medusa/` Nx project added to the workspace
- `tsconfig.base.json` gains a path alias for `@condorpay/medusa`
- No changes to `@condorpay/core`, `@condorpay/co`, or `condorpay` packages
- No Medusa database migrations required
- Merchants configure providers in `medusa-config.ts` under the payment module options
