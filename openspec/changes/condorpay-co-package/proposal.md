## Why

Colombia is the first LATAM market targeted by the condorpay SDK; without a country-specific package, developers cannot integrate with Bre-B (the Colombian central bank's instant QR payment rail) or Wompi (the leading Colombian payment gateway) through a unified, zero-dependency TypeScript library. This package establishes the Colombia integration and serves as the reference implementation for future country packages.

## What Changes

- New `@condorpay/co` package introduced under `packages/co` (published as `@condorpay/co`)
- Implements the Bre-B instant payment module:
  - EMVCo QR Code Specification-compliant payload builder (TLV encoding)
  - CRC16-CCITT checksum calculation and validation (pure TypeScript, no deps)
  - QR string generation and SVG output (zero-dependency, pure path-based SVG)
- Implements the Wompi module:
  - Payment link creation (`POST /payment_links`)
  - Payment link retrieval (`GET /payment_links/:id`)
  - Webhook HMAC-SHA256 signature validation (using Web Crypto API)
  - Payouts / dispersion to third parties (`POST /transfers`)
- `CondorPayCo` class extending `AbstractPaymentProvider` from `@condorpay/core`, wiring Bre-B and Wompi under a unified payment lifecycle API
- All monetary amounts in Colombian Pesos (COP) enforced via `@condorpay/core`'s `Currency.COP` validation
- Zero runtime dependencies; depends only on `@condorpay/core` as a peer dependency
- TypeScript 6, strict mode; targets Node.js 20+ and modern browsers

## Capabilities

### New Capabilities

- `breb-qr`: EMVCo-compliant TLV payload builder for Bre-B QR codes, CRC16-CCITT checksum, and zero-dependency SVG QR code generation
- `wompi-payment-links`: Wompi payment link lifecycle — create and retrieve payment links via the Wompi REST API
- `wompi-webhook-validation`: Validate inbound Wompi webhook event authenticity using HMAC-SHA256 and the Web Crypto API
- `wompi-payouts`: Initiate and track third-party payouts (dispersions) through the Wompi transfers API
- `co-payment-provider`: `CondorPayCo` class extending `AbstractPaymentProvider` — unified Colombia payment lifecycle integrating Bre-B and Wompi modules

### Modified Capabilities

## Impact

- New package: `packages/co` (published as `@condorpay/co`)
- Peer dependency on `@condorpay/core` (all base types, `HttpClient`, `AbstractPaymentProvider`, error classes)
- Uses Web Crypto API (`globalThis.crypto.subtle`) for HMAC — available in Node.js 20+ and all modern browsers
- No bundler required; dual ESM + CJS output via `tsc`, mirroring `@condorpay/core` build pattern
- Future country packages (`@condorpay/mx`, `@condorpay/br`, etc.) will follow the same structure
