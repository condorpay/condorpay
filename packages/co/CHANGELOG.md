# @condorpay/co

## 0.2.0

### Minor Changes

- c95fb8b: Fix Wompi payment links returning no checkout URL

  `mapPaymentLink` was typed as `(raw: WompiPaymentLink) => WompiPaymentLink`,
  treating Wompi's raw API response as if it were already the domain object. The
  API answers in snake_case, so `amount`, `status`, `createdAt` and `expiresAt`
  were all read as `undefined` while TypeScript reported them as present.

  `url` was worse: Wompi returns no URL field at all for a payment link. Callers
  therefore received a link whose `url` was `undefined`, and once serialised to
  JSON the key vanished entirely. Integrations that redirect a shopper to the
  hosted checkout had nowhere to send them, with no error to explain why.

  Changes:

  - Add `WompiPaymentLinkResponse`, the actual snake_case response shape, and map
    from it explicitly instead of passing the payload through.
  - Derive the checkout URL as `${checkoutUrl}/l/${id}`, which is how Wompi
    addresses hosted payment links.
  - Add `WompiConfig.checkoutUrl`, defaulting to `https://checkout.wompi.co`, so
    sandbox integrations can point at their own host.
  - Convert `amount_in_cents` to major units and map `active` onto the link
    status, both of which were previously undefined.

  The existing test could not have caught this: its fixture returned the domain
  shape rather than a real API response, so the pass-through mapper satisfied it.
  The fixture now mirrors an actual `/payment_links` response.

  `@condorpay/core` also gains the provider's own explanation in HTTP errors.
  The response body was already captured in `responseBody`, but a message of just
  `HTTP 422: Unprocessable Entity` gave no clue which field was rejected. Errors
  now read `HTTP 422: Unprocessable Entity - La base de la transaccion debe ser
igual o mayor a 150000`.

### Patch Changes

- Updated dependencies [c95fb8b]
  - @condorpay/core@0.1.2

## 0.1.3

### Patch Changes

- 037592d: Republish packages with built `dist` artifacts included in the npm tarballs.

## 0.1.2

### Patch Changes

- 02e9f47: Republish packages with built `dist` artifacts included in the npm tarballs.

## 0.1.1

### Patch Changes

- 56aec2a: Fix Wompi event checksum validation to follow the documented `signature.properties` plus timestamp and events integrity key flow, and update Medusa webhook parsing to accept Wompi snake_case transaction payloads and `X-Event-Checksum`.
