## ADDED Requirements

### Requirement: `CondorPayWompiBaseProvider` is an abstract class with shared Wompi logic
`CondorPayWompiBaseProvider` SHALL extend Medusa's `AbstractPaymentProvider` and implement `initiatePayment`, `authorizePayment`, `capturePayment`, `retrievePayment`, `updatePayment`, `deletePayment`, `cancelPayment`, `getPaymentStatus`, `getWebhookActionAndData`, and `refundPayment`. Concrete subclasses set their own `static identifier`.

### Requirement: Three concrete Wompi provider subclasses with distinct identifiers
Three concrete classes SHALL extend `CondorPayWompiBaseProvider`:
- `CondorPayWompiCardProvider` with `static identifier = "condorpay-wompi-card"`
- `CondorPayWompiNequiProvider` with `static identifier = "condorpay-wompi-nequi"`
- `CondorPayWompiPseProvider` with `static identifier = "condorpay-wompi-pse"`

Each produces a distinct Medusa payment provider ID and appears as a separate payment option in Medusa admin.

#### Scenario: Each provider gets a unique Medusa ID
- **WHEN** all three Wompi providers are registered in `medusa-config.ts`
- **THEN** Medusa creates three distinct `PaymentProvider` records:
  `pp_condorpay-wompi-card_<id>`, `pp_condorpay-wompi-nequi_<id>`, `pp_condorpay-wompi-pse_<id>`

### Requirement: `initiatePayment` creates a Wompi payment link
`initiatePayment` SHALL call `WompiClient.createPaymentLink` with the amount, a `singleUse: true` flag, and the optional `redirectUrl` from `context`. It returns `InitiatePaymentOutput` with `id` set to the Wompi payment link ID, `status: "pending"`, and `data` containing `wompiUrl` and `wompiId`.

#### Scenario: Payment session contains Wompi URL
- **WHEN** `initiatePayment` is called with a valid COP amount and `WompiProviderOptions`
- **THEN** the returned `data.wompiUrl` is a valid HTTPS URL
- **AND** `id` is the Wompi payment link ID string

#### Scenario: Non-COP currency is rejected
- **WHEN** `initiatePayment` is called with `currency_code: "USD"`
- **THEN** it throws `MedusaError` with type `INVALID_DATA`

### Requirement: `authorizePayment` returns `pending` status
Wompi payment links are authorized asynchronously via webhook. `authorizePayment` SHALL return `{ status: "pending", data: input.data }`.

#### Scenario: Authorize does not call Wompi API
- **WHEN** `authorizePayment` is called
- **THEN** it returns `{ status: "pending", data: input.data }` with no HTTP requests made

### Requirement: `capturePayment` is a successful no-op
Wompi payment links auto-capture at authorization. `capturePayment` SHALL return `{ data: input.data }` without making external calls.

#### Scenario: Capture is a no-op
- **WHEN** `capturePayment` is called with session data
- **THEN** it returns `{ data: input.data }` with no HTTP requests made

### Requirement: `retrievePayment` fetches the Wompi payment link status
`retrievePayment` SHALL call `WompiClient.getPaymentLink(id)` where `id` comes from `input.data.wompiId` and return the link data mapped to `RetrievePaymentOutput`.

#### Scenario: Retrieve returns current Wompi link data
- **WHEN** `retrievePayment` is called with `data: { wompiId: "<id>" }`
- **THEN** it calls `WompiClient.getPaymentLink("<id>")` and returns the result in `data`

### Requirement: `getPaymentStatus` maps Wompi link status to Medusa `PaymentSessionStatus`
`getPaymentStatus` SHALL call `WompiClient.getPaymentLink` and map:
- `ACTIVE` → `"pending"`
- `INACTIVE` → `"authorized"`
- `EXPIRED` → `"canceled"`

#### Scenario: Active Wompi link maps to pending
- **WHEN** `getPaymentStatus` is called and Wompi returns `status: "ACTIVE"`
- **THEN** the returned `status` is `"pending"`

#### Scenario: Inactive Wompi link maps to authorized
- **WHEN** `getPaymentStatus` is called and Wompi returns `status: "INACTIVE"`
- **THEN** the returned `status` is `"authorized"`

### Requirement: `getWebhookActionAndData` validates the Wompi HMAC and maps the event to a Medusa action
`getWebhookActionAndData` SHALL validate the incoming `WompiWebhookEvent` using `validateWompiWebhook`. If valid and `transaction.status` is `APPROVED`, it returns `{ action: PaymentActions.AUTHORIZED, data: { session_id, amount } }`. If `DECLINED`, `VOIDED`, or `ERROR`, it returns `{ action: PaymentActions.FAILED }`. If validation fails, it returns `{ action: PaymentActions.NOT_SUPPORTED }`.

#### Scenario: Approved transaction produces AUTHORIZED action
- **WHEN** a valid Wompi webhook with `transaction.status: "APPROVED"` arrives
- **THEN** `getWebhookActionAndData` returns `action: PaymentActions.AUTHORIZED`
- **AND** `data.session_id` matches `transaction.reference`
- **AND** `data.amount` equals `transaction.amountInCents / 100`

#### Scenario: Declined transaction produces FAILED action
- **WHEN** a valid Wompi webhook with `transaction.status: "DECLINED"` arrives
- **THEN** `getWebhookActionAndData` returns `action: PaymentActions.FAILED`

#### Scenario: Invalid HMAC returns NOT_SUPPORTED
- **WHEN** the webhook HMAC does not match
- **THEN** `getWebhookActionAndData` returns `action: PaymentActions.NOT_SUPPORTED` without throwing

### Requirement: `refundPayment` throws `MedusaError` with type `NOT_ALLOWED`
Wompi v1 does not expose a refund endpoint. `refundPayment` SHALL throw `MedusaError` with `MedusaError.Types.NOT_ALLOWED`.

#### Scenario: Refund attempt is rejected
- **WHEN** `refundPayment` is called
- **THEN** it throws `MedusaError` with type `NOT_ALLOWED`

### Requirement: `cancelPayment` and `deletePayment` return a no-op response
Wompi payment links cannot be deleted via API. `cancelPayment` and `deletePayment` SHALL return `{ data: input.data }` without making external calls.

#### Scenario: Cancel and delete return successfully without API calls
- **WHEN** `cancelPayment` or `deletePayment` is called
- **THEN** each returns `{ data: input.data }` with no HTTP requests made
