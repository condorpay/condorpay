# @condorpay/medusa

## 2.0.0

### Major Changes

- 158a588: Reconcile Wompi payments with the order that started them.

  The Medusa providers created a Wompi **payment link** for each checkout. A
  payment link cannot carry a merchant reference, so Wompi minted its own, and
  the resulting webhook arrived bearing an identifier Medusa had never issued.
  `session_id` never matched a payment session, so an approved payment produced
  no order: the shopper was charged and the sale was lost.

  The providers now redirect to **Wompi Web Checkout**, which takes the reference
  as an input. Medusa's payment session id is sent as that reference and comes
  back verbatim in the webhook, so the callback resolves to the session that
  opened it.

  Alongside that:

  - `authorizePayment` queries Wompi for the transaction instead of always
    answering `pending`, so a payment can actually reach `authorized`.
  - A `redirectUrl` option returns the shopper to the store; previously they were
    left on Wompi's receipt with no way back.
  - `integritySecret` is now a distinct option from `eventsIntegrityKey`. Wompi
    issues two different secrets — `prod_integrity_*` signs outgoing checkouts,
    `prod_events_*` verifies incoming webhooks — and they are not interchangeable.
  - Checkout no longer makes an API call, so it cannot fail on a network round
    trip or on the payment-link amount minimum.

  **Breaking:** `wompi.integritySecret` is now required. Session data carries
  `wompiReference` in place of `wompiId`; `wompiUrl` is unchanged.

### Patch Changes

- Updated dependencies [158a588]
  - @condorpay/co@0.3.0

## 1.0.0

### Patch Changes

- Updated dependencies [c95fb8b]
  - @condorpay/co@0.2.0
  - @condorpay/core@0.1.2

## 0.1.3

### Patch Changes

- 037592d: Republish packages with built `dist` artifacts included in the npm tarballs.
- Updated dependencies [037592d]
  - @condorpay/co@0.1.3

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
