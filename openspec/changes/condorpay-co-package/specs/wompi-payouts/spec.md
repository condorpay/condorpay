## ADDED Requirements

### Requirement: Create payout
`WompiClient` SHALL expose a `createPayout(request: CreatePayoutRequest): Promise<WompiPayout>` method that calls `POST /transfers` on the Wompi API, authenticated with the private key as a Bearer token. This initiates a dispersion of funds from the merchant's Wompi balance to a third-party bank account.

#### Scenario: Successful payout creation
- **WHEN** `createPayout` is called with a valid `CreatePayoutRequest` for a COP amount
- **THEN** the method SHALL return a `WompiPayout` object containing at minimum `id`, `status`, `amount`, and `currency`

#### Scenario: Non-COP amount throws ValidationError
- **WHEN** `createPayout` is called with an amount whose currency is not `Currency.COP`
- **THEN** the method SHALL throw a `ValidationError` before making any HTTP request

#### Scenario: API error is wrapped in NetworkError
- **WHEN** the Wompi API responds with a non-2xx status code
- **THEN** `createPayout` SHALL throw a `NetworkError` with the HTTP `statusCode`

### Requirement: Get payout
`WompiClient` SHALL expose a `getPayout(id: string): Promise<WompiPayout>` method that calls `GET /transfers/:id`, authenticated with the private key as a Bearer token.

#### Scenario: Successful payout retrieval
- **WHEN** `getPayout` is called with an existing payout ID
- **THEN** the method SHALL return a `WompiPayout` object

#### Scenario: Not found throws NetworkError
- **WHEN** the Wompi API responds with `404` for the given ID
- **THEN** `getPayout` SHALL throw a `NetworkError` with `statusCode: 404`

### Requirement: CreatePayoutRequest interface
The module SHALL export a `CreatePayoutRequest` interface with: `amount` (`Amount` — currency MUST be `Currency.COP`), `reference` (string, unique per payout), `destinationBankAccount` (`BankAccountInfo`), `description` (optional string).

#### Scenario: Interface is importable
- **WHEN** a consumer imports `CreatePayoutRequest` from `@condorpay/co`
- **THEN** the type SHALL resolve without error

### Requirement: BankAccountInfo interface
The module SHALL export a `BankAccountInfo` interface with: `bankCode` (string — Colombian bank code), `accountNumber` (string), `accountType` (`BankAccountType`), `holderName` (string), `holderIdType` (`IdType`), `holderId` (string).

#### Scenario: Interface is importable
- **WHEN** a consumer imports `BankAccountInfo` from `@condorpay/co`
- **THEN** the type SHALL resolve without error

### Requirement: BankAccountType enum
The module SHALL export a `BankAccountType` enum with values: `SAVINGS_ACCOUNT`, `CHECKING_ACCOUNT`.

#### Scenario: Enum is importable and exhaustive
- **WHEN** a consumer imports `BankAccountType` from `@condorpay/co`
- **THEN** the enum SHALL contain `SAVINGS_ACCOUNT` and `CHECKING_ACCOUNT`

### Requirement: IdType enum
The module SHALL export an `IdType` enum with values representing Colombian document types: `CC` (Cédula de Ciudadanía), `CE` (Cédula de Extranjería), `NIT` (Número de Identificación Tributaria), `PP` (Pasaporte).

#### Scenario: Enum is importable and contains Colombian document types
- **WHEN** a consumer imports `IdType` from `@condorpay/co`
- **THEN** the enum SHALL contain `CC`, `CE`, `NIT`, and `PP`

### Requirement: WompiPayout interface
The module SHALL export a `WompiPayout` interface with: `id` (string), `status` (`WompiPayoutStatus`), `amount` (`Amount`), `currency` (`Currency`), `reference` (string), `createdAt` (string), `completedAt` (optional string), `errorMessage` (optional string).

#### Scenario: Interface is importable
- **WHEN** a consumer imports `WompiPayout` from `@condorpay/co`
- **THEN** the type SHALL resolve without error

### Requirement: WompiPayoutStatus enum
The module SHALL export a `WompiPayoutStatus` enum with values: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `REVERSED`.

#### Scenario: Enum is importable and exhaustive
- **WHEN** a consumer imports `WompiPayoutStatus` from `@condorpay/co`
- **THEN** the enum SHALL contain `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, and `REVERSED`
