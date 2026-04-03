## ADDED Requirements

### Requirement: Webhook signature validation
The module SHALL export a `validateWompiWebhook(event: WompiWebhookEvent, signature: string, eventKey: string): Promise<boolean>` function that verifies the authenticity of a Wompi webhook event using HMAC-SHA256. The verification SHALL use the Web Crypto API (`globalThis.crypto.subtle`) so it works in both Node.js 20+ and modern browsers.

The signature is computed as `HMAC-SHA256(eventKey, checksumString)` where `checksumString = event.data.transaction.id + event.data.transaction.status + event.data.transaction.amountInCents + event.data.transaction.currency + event.data.transaction.paymentMethodType + event.timestamp`.

#### Scenario: Valid signature returns true
- **WHEN** `validateWompiWebhook` is called with an event and the correct HMAC-SHA256 signature computed from the event key
- **THEN** the function SHALL return `true`

#### Scenario: Invalid signature returns false
- **WHEN** `validateWompiWebhook` is called with a tampered event or a wrong signature
- **THEN** the function SHALL return `false`

#### Scenario: Function returns a Promise
- **WHEN** `validateWompiWebhook` is called
- **THEN** the return value SHALL be a `Promise<boolean>` (async, due to Web Crypto API)

### Requirement: WompiWebhookEvent interface
The module SHALL export a `WompiWebhookEvent` interface representing the Wompi webhook payload structure with: `event` (string, e.g. `"transaction.updated"`), `data` (object containing `transaction: WompiTransaction`), `environment` (string), `signature` (object with `checksum` string and `properties` string array), `timestamp` (number — Unix epoch seconds).

#### Scenario: Interface is importable
- **WHEN** a consumer imports `WompiWebhookEvent` from `@condorpay/co`
- **THEN** the type SHALL resolve without error

### Requirement: WompiTransaction interface
The module SHALL export a `WompiTransaction` interface with: `id` (string), `status` (`WompiTransactionStatus`), `amountInCents` (number), `currency` (`Currency`), `paymentMethodType` (string), `reference` (string), `createdAt` (string).

#### Scenario: Interface is importable
- **WHEN** a consumer imports `WompiTransaction` from `@condorpay/co`
- **THEN** the type SHALL resolve without error

### Requirement: WompiTransactionStatus enum
The module SHALL export a `WompiTransactionStatus` enum with values: `PENDING`, `APPROVED`, `DECLINED`, `VOIDED`, `ERROR`.

#### Scenario: Enum is importable and exhaustive
- **WHEN** a consumer imports `WompiTransactionStatus` from `@condorpay/co`
- **THEN** the enum SHALL contain `PENDING`, `APPROVED`, `DECLINED`, `VOIDED`, and `ERROR`

### Requirement: Webhook validation does not throw on invalid input
The `validateWompiWebhook` function SHALL return `false` (not throw) when the input is structurally invalid (e.g., missing fields, non-string signature). It SHALL only throw a `ValidationError` if `eventKey` is an empty string.

#### Scenario: Empty event key throws ValidationError
- **WHEN** `validateWompiWebhook` is called with an empty `eventKey` string
- **THEN** the function SHALL throw a `ValidationError` with a field error on `eventKey`

#### Scenario: Structurally malformed event returns false
- **WHEN** `validateWompiWebhook` is called with a null or incomplete event object
- **THEN** the function SHALL return `false` without throwing
