# @condorpay/medusa

## 0.1.2

### Patch Changes

- 02e9f47: Republish packages with built `dist` artifacts included in the npm tarballs.
- Updated dependencies [02e9f47]
  - @condorpay/co@0.1.2

## 0.1.1

### Patch Changes

- 56aec2a: Fix Wompi event checksum validation to follow the documented `signature.properties` plus timestamp and events integrity key flow, and update Medusa webhook parsing to accept Wompi snake_case transaction payloads and `X-Event-Checksum`.
- Updated dependencies [56aec2a]
  - @condorpay/co@0.1.1

## 0.1.0

### Minor Changes

- Initial release: Medusa v2 payment providers for Bre-B QR and Wompi (card, Nequi, PSE), with Wompi webhook HMAC validation.
