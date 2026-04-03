## ADDED Requirements

### Requirement: CondorPay client accepts country-based config
The `CondorPay` class SHALL accept a discriminated union config object where `country` identifies the target country and the remaining fields are the country-specific configuration.

#### Scenario: Instantiate for Colombia
- **WHEN** `new CondorPay({ country: "co", wompi: { publicKey, privateKey } })` is called
- **THEN** a valid `CondorPay` instance is returned without error

#### Scenario: TypeScript rejects unknown country
- **WHEN** `new CondorPay({ country: "mx" })` is compiled
- **THEN** TypeScript emits a type error (no runtime throw required)

### Requirement: CondorPay exposes typed country accessor
The `CondorPay` instance SHALL expose a `co` property returning the `CondorPayCo` instance when initialized with `country: "co"`.

#### Scenario: Colombia accessor returns CondorPayCo
- **WHEN** `cp = new CondorPay({ country: "co", wompi: { publicKey, privateKey } })`
- **THEN** `cp.co` is an instance of `CondorPayCo`

#### Scenario: Colombia accessor provides payment methods
- **WHEN** `cp.co.createPayment(request)` is called with a valid COP request
- **THEN** it resolves to a `PaymentResponse` (delegates to `CondorPayCo`)

#### Scenario: Colombia accessor provides QR generation
- **WHEN** `cp.co.generateQr({ merchantName, merchantCity, merchantAccountId })` is called
- **THEN** it returns a `BrebQrResult` with `payload` and `svg` fields

### Requirement: CondorPay country accessor is type-narrowed
When the config `country` is `"co"`, the TypeScript type of `cp.co` SHALL be `CondorPayCo` (not `CondorPayCo | undefined`), so no null-check is required at the call site.

#### Scenario: No undefined check needed for known country
- **WHEN** `const cp = new CondorPay({ country: "co", wompi: config })` is assigned to a variable typed as `CondorPay`
- **THEN** `cp.co.generateQr(...)` compiles without a non-null assertion or optional chain
