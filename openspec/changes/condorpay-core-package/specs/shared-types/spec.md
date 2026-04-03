## ADDED Requirements

### Requirement: Currency enum
The package SHALL export a `Currency` enum listing all supported LATAM currencies. Initial values MUST include at minimum: `COP` (Colombian Peso), `MXN` (Mexican Peso), `BRL` (Brazilian Real), `ARS` (Argentine Peso), `CLP` (Chilean Peso), `PEN` (Peruvian Sol), `UYU` (Uruguayan Peso).

#### Scenario: Currency enum is exhaustive for initial LATAM scope
- **WHEN** a consumer imports `Currency` from `@condorpay/core`
- **THEN** the enum SHALL contain all seven initial LATAM currency codes

### Requirement: Amount type
The package SHALL export an `Amount` type defined as `{ value: string; currency: Currency }` where `value` is a decimal string representation of the monetary amount.

#### Scenario: Amount with valid decimal string
- **WHEN** a consumer constructs an `Amount` with `value: "100.50"` and `currency: Currency.COP`
- **THEN** the TypeScript compiler SHALL accept the value without error

#### Scenario: Amount with integer string
- **WHEN** a consumer constructs an `Amount` with `value: "500"` and `currency: Currency.MXN`
- **THEN** the TypeScript compiler SHALL accept the value without error

### Requirement: PaymentStatus enum
The package SHALL export a `PaymentStatus` enum with values: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `CANCELLED`, `REFUNDED`.

#### Scenario: Status covers terminal and non-terminal states
- **WHEN** a consumer imports `PaymentStatus`
- **THEN** the enum SHALL contain at least one non-terminal state (`PENDING`, `PROCESSING`) and at least one terminal state (`COMPLETED`, `FAILED`, `CANCELLED`, `REFUNDED`)

### Requirement: PaymentRequest interface
The package SHALL export a `PaymentRequest` interface containing: `id` (string), `amount` (Amount), `description` (string), `metadata` (optional `Record<string, string>`), and `idempotencyKey` (string).

#### Scenario: Minimal valid PaymentRequest
- **WHEN** a consumer constructs a `PaymentRequest` with `id`, `amount`, `description`, and `idempotencyKey`
- **THEN** the TypeScript compiler SHALL accept the object without error

#### Scenario: PaymentRequest with metadata
- **WHEN** a consumer constructs a `PaymentRequest` with an optional `metadata` object
- **THEN** the TypeScript compiler SHALL accept the object without error

### Requirement: PaymentResponse interface
The package SHALL export a `PaymentResponse` interface containing: `id` (string), `status` (PaymentStatus), `amount` (Amount), `createdAt` (string, ISO 8601), `updatedAt` (string, ISO 8601), and `metadata` (optional `Record<string, string>`).

#### Scenario: Minimal valid PaymentResponse
- **WHEN** a consumer constructs a `PaymentResponse` with all required fields
- **THEN** the TypeScript compiler SHALL accept the object without error

### Requirement: All types exported from package root
The package SHALL re-export all shared types from its main entry point so consumers can import from `@condorpay/core` without deep path imports.

#### Scenario: Single import path
- **WHEN** a consumer writes `import { Amount, Currency, PaymentStatus, PaymentRequest, PaymentResponse } from '@condorpay/core'`
- **THEN** all symbols SHALL resolve without error
