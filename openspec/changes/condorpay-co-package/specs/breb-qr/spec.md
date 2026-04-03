## ADDED Requirements

### Requirement: EMVCo TLV payload builder
The `BrebQr` module SHALL export a `buildPayload(options: BrebQrOptions): string` function that produces a valid EMVCo QR Code Specification TLV-encoded ASCII string. The output SHALL conform to the Bre-B / Transferencias Inmediatas standard, including the following mandatory tags: `00` (Payload Format Indicator = `"01"`), `01` (Point of Initiation Method), `26` (Merchant Account Information for Bre-B), `52` (Merchant Category Code), `53` (Transaction Currency = `"170"` for COP), `58` (Country Code = `"CO"`), `59` (Merchant Name), `60` (Merchant City), `63` (CRC).

#### Scenario: Minimal valid payload is produced
- **WHEN** `buildPayload` is called with a valid `BrebQrOptions` object containing merchant name, merchant city, and a Bre-B merchant account identifier
- **THEN** the function SHALL return a non-empty ASCII string starting with `"000201"` and ending with a 4-character hex CRC preceded by tag `"63"`

#### Scenario: Optional amount is included when provided
- **WHEN** `buildPayload` is called with a `transactionAmount` field in `BrebQrOptions`
- **THEN** the returned payload SHALL include tag `54` with the formatted amount string

#### Scenario: Dynamic QR when amount is present
- **WHEN** `buildPayload` is called with a `transactionAmount`
- **THEN** tag `01` in the payload SHALL have value `"12"` (dynamic, single-use)

#### Scenario: Static QR when no amount is present
- **WHEN** `buildPayload` is called without a `transactionAmount`
- **THEN** tag `01` in the payload SHALL have value `"11"` (static, reusable)

### Requirement: BrebQrOptions interface
The module SHALL export a `BrebQrOptions` interface with: `merchantName` (string, max 25 chars), `merchantCity` (string, max 15 chars), `merchantAccountId` (string — Bre-B registered merchant ID), `merchantCategoryCode` (optional string, default `"0000"`), `transactionAmount` (optional `Amount` with `currency: Currency.COP`), `additionalData` (optional object with `referenceLabel` string).

#### Scenario: Interface is importable from subpath and root
- **WHEN** a consumer imports `BrebQrOptions` from `@condorpay/co` or `@condorpay/co/breb`
- **THEN** the type SHALL resolve without error

### Requirement: CRC16-CCITT checksum
The module SHALL export a `crc16(input: string): string` function that computes the CRC16-CCITT checksum (polynomial `0x1021`, initial value `0xFFFF`, no input/output reflection) of the input string and returns the result as a 4-character uppercase hexadecimal string.

#### Scenario: Known CRC value matches EMVCo test vector
- **WHEN** `crc16` is called with the EMVCo reference payload `"00020126360014BR.GOV.BCB.PIX0114+5551912345670208your key520400005303986540510.005802BR5913Fulano de Tal6008BRASILIA62070503***6304"` (stripped of final CRC field)
- **THEN** the function SHALL return `"AE86"` (the known-correct CRC for that payload)

#### Scenario: CRC of empty string
- **WHEN** `crc16("")` is called
- **THEN** the result SHALL be `"FFFF"` (CRC16-CCITT initial value with no data processed)

### Requirement: CRC validation
The module SHALL export a `validateCrc(payload: string): boolean` function that verifies the CRC16-CCITT checksum embedded in the last 4 characters of a payload string. It SHALL return `true` if the checksum matches the computed CRC of the payload excluding the final 4 characters, and `false` otherwise.

#### Scenario: Valid payload passes validation
- **WHEN** `validateCrc` is called with a payload whose last 4 characters are the correct CRC of the preceding content
- **THEN** the function SHALL return `true`

#### Scenario: Tampered payload fails validation
- **WHEN** `validateCrc` is called with a payload whose last 4 characters do not match the computed CRC
- **THEN** the function SHALL return `false`

### Requirement: QR SVG generation
The module SHALL export a `generateQr(options: BrebQrOptions): BrebQrResult` function (synchronous) that builds the EMVCo payload, encodes it as a QR matrix (ECC level M), and returns a `BrebQrResult` object containing `payload` (the raw EMVCo string) and `svg` (a self-contained inline SVG string).

#### Scenario: Result contains both payload and SVG
- **WHEN** `generateQr` is called with valid `BrebQrOptions`
- **THEN** the result SHALL have a non-empty `payload` string and a non-empty `svg` string starting with `"<svg"`

#### Scenario: SVG is self-contained
- **WHEN** the returned `svg` string is inserted into a browser DOM
- **THEN** it SHALL render a scannable QR code without any external resources

#### Scenario: QR payload matches validateCrc
- **WHEN** `generateQr` is called and `validateCrc` is applied to `result.payload`
- **THEN** `validateCrc` SHALL return `true`

### Requirement: BrebQrResult interface
The module SHALL export a `BrebQrResult` interface with `payload: string` and `svg: string`.

#### Scenario: Interface is importable
- **WHEN** a consumer imports `BrebQrResult` from `@condorpay/co`
- **THEN** the type SHALL resolve without error
