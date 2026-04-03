# @condorpay/medusa

Official [**Medusa v2**](https://docs.medusajs.com/) payment providers for **CondorPay** in **Colombia**: **Bre-B** (EMVCo QR) and **Wompi** payment links (card, Nequi, PSE), with **HMAC validation** for Wompi webhooks.

## Requirements

- **Node.js** 20 or later
- **Medusa** v2 (`@medusajs/framework` >= 2.5)

## Install

```bash
npm install @condorpay/medusa
```

```bash
pnpm add @condorpay/medusa
```

Peer dependencies must be satisfied in your Medusa app:

```bash
pnpm add @medusajs/framework @condorpay/co @condorpay/core
```

## Peer dependencies

| Package | Role |
| --- | --- |
| `@medusajs/framework` | Medusa v2 payment provider APIs |
| `@condorpay/co` | Bre-B QR, Wompi client, webhook helpers |
| `@condorpay/core` | Shared types and errors |

## Providers

Register the services you need in your Medusa payment module. Each class extends Medusa’s `AbstractPaymentProvider` and exposes a stable `identifier` for admin and checkout.

| Class | `identifier` | Use case |
| --- | --- | --- |
| `CondorPayBrebProvider` | `condorpay-breb` | Bre-B EMVCo QR (`payload` + `svg` in session data) |
| `CondorPayWompiCardProvider` | `condorpay-wompi-card` | Wompi payment link (card) |
| `CondorPayWompiNequiProvider` | `condorpay-wompi-nequi` | Wompi payment link (Nequi) |
| `CondorPayWompiPseProvider` | `condorpay-wompi-pse` | Wompi payment link (PSE) |

## Imports

| Path | When to use |
| --- | --- |
| `@condorpay/medusa` | Barrel: all providers and shared types |
| `@condorpay/medusa/breb` | Bre-B provider only |
| `@condorpay/medusa/wompi` | Wompi providers and base class |

Example:

```ts
import {
	CondorPayBrebProvider,
	CondorPayWompiCardProvider,
} from "@condorpay/medusa";
```

## Webhooks

Wompi webhook verification uses the **Events integrity** secret from your Wompi dashboard. Pass it in your provider options as `eventsIntegrityKey` (see `WompiProviderOptions` / `CondorPayMedusaWompiConfig` in the exported types).

## License

MIT
