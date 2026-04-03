## ADDED Requirements

### Requirement: CondorPayCo class
The package SHALL export a `CondorPayCo` class that extends `AbstractPaymentProvider` from `@condorpay/core`. It SHALL be the primary entry point for the Colombia integration and wire together the Bre-B and Wompi modules.

#### Scenario: CondorPayCo cannot be imported without @condorpay/core
- **WHEN** `@condorpay/core` is not installed
- **THEN** the TypeScript compiler SHALL emit an error on import of `@condorpay/co`

#### Scenario: CondorPayCo is instantiable with valid config
- **WHEN** a consumer constructs `new CondorPayCo({ wompi: { publicKey: 'x', privateKey: 'y' } })`
- **THEN** the instance SHALL be created without error and `provider.name` SHALL be `"condorpay-co"`

### Requirement: Provider name
`CondorPayCo` SHALL declare `readonly name = "condorpay-co"`.

#### Scenario: Name property is correct
- **WHEN** `provider.name` is accessed on a `CondorPayCo` instance
- **THEN** the value SHALL be the string `"condorpay-co"`

### Requirement: createPayment — Wompi payment link
`CondorPayCo.createPayment(request: PaymentRequest): Promise<PaymentResponse>` SHALL create a Wompi payment link and return a `PaymentResponse`. The `PaymentResponse.id` SHALL be the Wompi payment link ID. The response SHALL include a `metadata.wompiUrl` field containing the payment link URL.

#### Scenario: Successful createPayment returns PaymentResponse
- **WHEN** `createPayment` is called with a valid `PaymentRequest` in COP
- **THEN** the method SHALL return a `PaymentResponse` with `status: PaymentStatus.PENDING` and a non-empty `metadata.wompiUrl`

#### Scenario: Non-COP amount throws ValidationError
- **WHEN** `createPayment` is called with an amount in a currency other than COP
- **THEN** the method SHALL throw a `ValidationError` with a field error on `amount.currency`

### Requirement: getPayment — retrieve Wompi payment link status
`CondorPayCo.getPayment(id: string): Promise<PaymentResponse>` SHALL fetch the Wompi payment link by ID and map its status to `PaymentStatus`.

Status mapping:
- `WompiPaymentLinkStatus.ACTIVE` → `PaymentStatus.PENDING`
- `WompiPaymentLinkStatus.INACTIVE` → `PaymentStatus.COMPLETED`
- `WompiPaymentLinkStatus.EXPIRED` → `PaymentStatus.CANCELLED`

#### Scenario: Active payment link maps to PENDING
- **WHEN** `getPayment` is called for a payment link with `WompiPaymentLinkStatus.ACTIVE`
- **THEN** the returned `PaymentResponse.status` SHALL be `PaymentStatus.PENDING`

#### Scenario: Inactive payment link maps to COMPLETED
- **WHEN** `getPayment` is called for a payment link with `WompiPaymentLinkStatus.INACTIVE`
- **THEN** the returned `PaymentResponse.status` SHALL be `PaymentStatus.COMPLETED`

#### Scenario: Expired payment link maps to CANCELLED
- **WHEN** `getPayment` is called for a payment link with `WompiPaymentLinkStatus.EXPIRED`
- **THEN** the returned `PaymentResponse.status` SHALL be `PaymentStatus.CANCELLED`

### Requirement: cancelPayment — expire Wompi payment link
`CondorPayCo.cancelPayment(id: string): Promise<PaymentResponse>` SHALL not be natively supported by the Wompi link API (no direct cancel endpoint). The method SHALL throw a `CondorPayError` with code `ErrorCode.PAYMENT_ALREADY_CANCELLED` if the link is already expired, or a `CondorPayError` with a descriptive message if cancellation is not supported for active links.

#### Scenario: Cancel on already-expired link throws CondorPayError
- **WHEN** `cancelPayment` is called for a payment link with `WompiPaymentLinkStatus.EXPIRED`
- **THEN** the method SHALL throw a `CondorPayError` with code `ErrorCode.PAYMENT_ALREADY_CANCELLED`

### Requirement: generateQr — Bre-B QR code
`CondorPayCo` SHALL expose a `generateQr(options: BrebQrOptions): BrebQrResult` method (synchronous) that delegates to the `BrebQr.generateQr` function.

#### Scenario: Successful QR generation
- **WHEN** `generateQr` is called with valid `BrebQrOptions`
- **THEN** the method SHALL return a `BrebQrResult` with non-empty `payload` and `svg`

### Requirement: CondorPayCoConfig interface
The package SHALL export a `CondorPayCoConfig` interface with: `wompi` (`WompiConfig`), `breb` (optional `BrebMerchantConfig`).

#### Scenario: Config is importable
- **WHEN** a consumer imports `CondorPayCoConfig` from `@condorpay/co`
- **THEN** the type SHALL resolve without error

### Requirement: BrebMerchantConfig interface
The package SHALL export a `BrebMerchantConfig` interface with: `merchantAccountId` (string), `merchantName` (string), `merchantCity` (string), `merchantCategoryCode` (optional string, default `"0000"`).

#### Scenario: Interface is importable
- **WHEN** a consumer imports `BrebMerchantConfig` from `@condorpay/co`
- **THEN** the type SHALL resolve without error

### Requirement: All public symbols exported from package root
`CondorPayCo`, `WompiClient`, `BrebQr`, all interfaces, and all enums SHALL be re-exported from the package's main entry point (`@condorpay/co`) and from subpath exports (`@condorpay/co/breb`, `@condorpay/co/wompi`).

#### Scenario: Root import provides all symbols
- **WHEN** a consumer writes `import { CondorPayCo, WompiClient, BrebQr, BankAccountType, IdType } from '@condorpay/co'`
- **THEN** all symbols SHALL resolve without error

#### Scenario: Subpath import for Bre-B only
- **WHEN** a consumer writes `import { BrebQr, buildPayload, crc16 } from '@condorpay/co/breb'`
- **THEN** all symbols SHALL resolve without error

#### Scenario: Subpath import for Wompi only
- **WHEN** a consumer writes `import { WompiClient, WompiPayoutStatus } from '@condorpay/co/wompi'`
- **THEN** all symbols SHALL resolve without error
