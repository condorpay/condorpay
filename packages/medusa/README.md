# @condorpay/medusa

Official [Medusa v2](https://docs.medusajs.com/) payment module providers for **CondorPay** Colombia: **Bre-B QR** and **Wompi** (card, Nequi, PSE).

## Peer dependencies

- `@medusajs/framework` (>= 2.5)
- `@condorpay/co`
- `@condorpay/core`

## Providers

| Class | Identifier | Use case |
| --- | --- | --- |
| `CondorPayBrebProvider` | `condorpay-breb` | Bre-B EMVCo QR (`payload` + `svg` in session data) |
| `CondorPayWompiCardProvider` | `condorpay-wompi-card` | Wompi payment link (card) |
| `CondorPayWompiNequiProvider` | `condorpay-wompi-nequi` | Wompi payment link (Nequi) |
| `CondorPayWompiPseProvider` | `condorpay-wompi-pse` | Wompi payment link (PSE) |

Register the providers you need in the Medusa payment module. Webhook HMAC verification uses the Wompi **Events integrity** secret (`eventsIntegrityKey` in provider options).

## Imports

- Main barrel: `@condorpay/medusa`
- Bre-B only: `@condorpay/medusa/breb`
- Wompi only: `@condorpay/medusa/wompi`
