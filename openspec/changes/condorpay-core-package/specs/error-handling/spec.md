## ADDED Requirements

### Requirement: CondorPayError base class
The package SHALL export a `CondorPayError` class that extends the native `Error`. It SHALL include: `code` (string, a value from the `ErrorCode` enum), `message` (string), and an optional `cause` (unknown).

#### Scenario: CondorPayError is instanceof Error
- **WHEN** a `CondorPayError` is thrown and caught
- **THEN** `error instanceof Error` SHALL be `true`

#### Scenario: CondorPayError carries a code
- **WHEN** a `CondorPayError` is constructed with `code: ErrorCode.UNKNOWN_ERROR`
- **THEN** `error.code` SHALL equal `'UNKNOWN_ERROR'`

### Requirement: NetworkError class
The package SHALL export a `NetworkError` that extends `CondorPayError`. It SHALL additionally carry: `statusCode` (optional number, the HTTP status code), and `responseBody` (optional string).

#### Scenario: NetworkError is instanceof CondorPayError
- **WHEN** a `NetworkError` is thrown and caught
- **THEN** `error instanceof CondorPayError` SHALL be `true`

#### Scenario: NetworkError with statusCode
- **WHEN** a `NetworkError` is constructed with `statusCode: 404`
- **THEN** `error.statusCode` SHALL equal `404`

### Requirement: ValidationError class
The package SHALL export a `ValidationError` that extends `CondorPayError`. It SHALL additionally carry a `fields` property: `Record<string, string>` mapping field names to validation failure messages.

#### Scenario: ValidationError is instanceof CondorPayError
- **WHEN** a `ValidationError` is thrown and caught
- **THEN** `error instanceof CondorPayError` SHALL be `true`

#### Scenario: ValidationError exposes field errors
- **WHEN** a `ValidationError` is constructed with `fields: { amount: 'must be positive' }`
- **THEN** `error.fields.amount` SHALL equal `'must be positive'`

### Requirement: ErrorCode enum
The package SHALL export an `ErrorCode` enum with at minimum: `UNKNOWN_ERROR`, `NETWORK_ERROR`, `REQUEST_TIMEOUT`, `INVALID_RESPONSE`, `VALIDATION_ERROR`, `PAYMENT_NOT_FOUND`, `PAYMENT_ALREADY_CANCELLED`.

#### Scenario: ErrorCode is importable and exhaustive for v1
- **WHEN** a consumer imports `ErrorCode` from `@condorpay/core`
- **THEN** all seven initial codes SHALL be present

### Requirement: Errors exported from package root
All error classes (`CondorPayError`, `NetworkError`, `ValidationError`) and the `ErrorCode` enum SHALL be re-exported from the package's main entry point.

#### Scenario: Single import path for errors
- **WHEN** a consumer writes `import { CondorPayError, NetworkError, ValidationError, ErrorCode } from '@condorpay/core'`
- **THEN** all symbols SHALL resolve without error
