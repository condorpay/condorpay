## ADDED Requirements

### Requirement: `CondorPayBrebProvider` extends Medusa `AbstractPaymentProvider`
`CondorPayBrebProvider` SHALL extend `AbstractPaymentProvider` from `@medusajs/framework/utils` and set `static identifier = "condorpay-breb"`. This identifier forms the Medusa payment provider ID `pp_condorpay-breb_<module-id>`.

#### Scenario: Provider is recognized as a Medusa payment provider
- **WHEN** `CondorPayBrebProvider` is registered in `medusa-config.ts` under the payment module
- **THEN** Medusa registers a `PaymentProvider` record with ID `pp_condorpay-breb_<module-id>`

### Requirement: `initiatePayment` generates a Bre-B QR and returns it in session data
`initiatePayment` SHALL call `generateQr` from `@condorpay/co`, assign a synthetic `id` of the form `breb:<uuid>`, and return `InitiatePaymentOutput` with `status: "pending"` and `data` containing `payload` (EMVCo string), `svg` (SVG string), and `generatedAt` (ISO timestamp).

#### Scenario: Payment session contains QR data
- **WHEN** `initiatePayment` is called with valid `BrebProviderOptions` and amount
- **THEN** the returned `data.payload` is a non-empty EMVCo string starting with `"000201"`
- **AND** `data.svg` is a non-empty SVG string starting with `"<svg"`
- **AND** `id` matches the pattern `/^breb:[0-9a-f-]{36}$/`

#### Scenario: `initiatePayment` makes no external HTTP calls
- **WHEN** `initiatePayment` is called with no network available
- **THEN** it succeeds (QR generation is a pure local computation)

#### Scenario: `initiatePayment` throws when Bre-B merchant config is missing
- **WHEN** `initiatePayment` is called but provider options contain no `breb` config
- **THEN** it throws a `MedusaError` with type `INVALID_DATA`

### Requirement: `authorizePayment` returns `pending` status
`authorizePayment` SHALL return `{ status: "pending", data: input.data }` because Bre-B authorization is asynchronous — it only completes when the webhook arrives.

#### Scenario: Authorize returns pending immediately
- **WHEN** `authorizePayment` is called with the session data from `initiatePayment`
- **THEN** the returned `status` is `"pending"`

### Requirement: `capturePayment` is a successful no-op
Bre-B is a push payment — funds are already settled when the webhook fires. `capturePayment` SHALL return `{ data: input.data }` without making any external calls.

#### Scenario: Capture succeeds without external calls
- **WHEN** `capturePayment` is called with session data
- **THEN** it returns `{ data: input.data }` with no HTTP requests made

### Requirement: `getPaymentStatus` returns the status stored in session data
`getPaymentStatus` SHALL read `data.status` from the stored session data and return it as `PaymentSessionStatus`. If absent, it returns `"pending"`.

#### Scenario: Status reflects stored session data
- **WHEN** `getPaymentStatus` is called with `data: { status: "authorized" }`
- **THEN** the returned `status` is `"authorized"`

### Requirement: `getWebhookActionAndData` validates the Wompi HMAC and maps the event to a Medusa action
`getWebhookActionAndData` SHALL validate the incoming Wompi webhook using `validateWompiWebhook` from `@condorpay/co`. If valid and `transaction.status` is `APPROVED`, it returns `{ action: PaymentActions.AUTHORIZED, data: { session_id, amount } }`. If `DECLINED`, `VOIDED`, or `ERROR`, it returns `{ action: PaymentActions.FAILED }`. If validation fails, it returns `{ action: PaymentActions.NOT_SUPPORTED }`.

#### Scenario: Approved Wompi event produces AUTHORIZED action
- **WHEN** a valid Wompi webhook with `transaction.status: "APPROVED"` arrives
- **THEN** `getWebhookActionAndData` returns `action: PaymentActions.AUTHORIZED` and the session ID extracted from `transaction.reference`

#### Scenario: Declined Wompi event produces FAILED action
- **WHEN** a valid Wompi webhook with `transaction.status: "DECLINED"` arrives
- **THEN** `getWebhookActionAndData` returns `action: PaymentActions.FAILED`

#### Scenario: Tampered HMAC returns NOT_SUPPORTED
- **WHEN** a webhook with an invalid HMAC signature arrives
- **THEN** `getWebhookActionAndData` returns `action: PaymentActions.NOT_SUPPORTED` without throwing

### Requirement: `refundPayment` throws `MedusaError` with type `NOT_ALLOWED`
Bre-B push payments cannot be refunded through this API in Phase 1. `refundPayment` SHALL throw `MedusaError` with `MedusaError.Types.NOT_ALLOWED`.

#### Scenario: Refund attempt is rejected
- **WHEN** `refundPayment` is called
- **THEN** it throws `MedusaError` with type `NOT_ALLOWED`
