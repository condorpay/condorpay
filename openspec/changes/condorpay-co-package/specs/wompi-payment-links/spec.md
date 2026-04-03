## ADDED Requirements

### Requirement: WompiClient class
The module SHALL export a `WompiClient` class that wraps the Wompi REST API using `@condorpay/core`'s `HttpClient`. It SHALL be constructed with a `WompiConfig` object containing `publicKey` (string) and `privateKey` (string). The client SHALL target `https://production.wompi.co/v1` by default, with the base URL overridable via a `baseUrl` option for sandbox testing.

#### Scenario: WompiClient instantiation with required config
- **WHEN** a consumer constructs `new WompiClient({ publicKey: 'pub_xxx', privateKey: 'priv_xxx' })`
- **THEN** the instance SHALL be created without error

#### Scenario: WompiClient instantiation with sandbox URL
- **WHEN** a consumer constructs `WompiClient` with `baseUrl: 'https://sandbox.wompi.co/v1'`
- **THEN** all subsequent API calls SHALL use the sandbox base URL

### Requirement: Create payment link
`WompiClient` SHALL expose a `createPaymentLink(request: CreatePaymentLinkRequest): Promise<WompiPaymentLink>` method that calls `POST /payment_links` on the Wompi API, authenticated with the private key as a Bearer token.

#### Scenario: Successful payment link creation
- **WHEN** `createPaymentLink` is called with a valid `CreatePaymentLinkRequest`
- **THEN** the method SHALL return a `WompiPaymentLink` object containing at minimum `id`, `url`, `amount`, `currency`, and `status`

#### Scenario: Invalid request throws ValidationError
- **WHEN** `createPaymentLink` is called with an amount whose currency is not `Currency.COP`
- **THEN** the method SHALL throw a `ValidationError` before making any HTTP request

#### Scenario: API error is wrapped in NetworkError
- **WHEN** the Wompi API responds with a non-2xx status code
- **THEN** `createPaymentLink` SHALL throw a `NetworkError` with the HTTP `statusCode` and raw response body

### Requirement: Get payment link
`WompiClient` SHALL expose a `getPaymentLink(id: string): Promise<WompiPaymentLink>` method that calls `GET /payment_links/:id`, authenticated with the public key as a Bearer token.

#### Scenario: Successful retrieval
- **WHEN** `getPaymentLink` is called with an existing payment link ID
- **THEN** the method SHALL return a `WompiPaymentLink` object

#### Scenario: Not found throws NetworkError
- **WHEN** the Wompi API responds with `404` for the given ID
- **THEN** `getPaymentLink` SHALL throw a `NetworkError` with `statusCode: 404`

### Requirement: CreatePaymentLinkRequest interface
The module SHALL export a `CreatePaymentLinkRequest` interface with: `name` (string, max 255 chars), `description` (optional string), `amount` (`Amount` — currency MUST be `Currency.COP`), `expiresAt` (optional ISO 8601 string), `singleUse` (optional boolean, default `false`), `collectShipping` (optional boolean), `redirectUrl` (optional string).

#### Scenario: Interface is importable
- **WHEN** a consumer imports `CreatePaymentLinkRequest` from `@condorpay/co`
- **THEN** the type SHALL resolve without error

### Requirement: WompiPaymentLink interface
The module SHALL export a `WompiPaymentLink` interface with: `id` (string), `name` (string), `url` (string), `amount` (`Amount`), `currency` (`Currency`), `status` (`WompiPaymentLinkStatus`), `createdAt` (string), `expiresAt` (optional string).

#### Scenario: Interface is importable
- **WHEN** a consumer imports `WompiPaymentLink` from `@condorpay/co`
- **THEN** the type SHALL resolve without error

### Requirement: WompiPaymentLinkStatus enum
The module SHALL export a `WompiPaymentLinkStatus` enum with values: `ACTIVE`, `INACTIVE`, `EXPIRED`.

#### Scenario: Enum is importable and exhaustive
- **WHEN** a consumer imports `WompiPaymentLinkStatus` from `@condorpay/co`
- **THEN** the enum SHALL contain `ACTIVE`, `INACTIVE`, and `EXPIRED`

### Requirement: WompiConfig interface
The module SHALL export a `WompiConfig` interface with: `publicKey` (string), `privateKey` (string), `baseUrl` (optional string).

#### Scenario: Interface is importable
- **WHEN** a consumer imports `WompiConfig` from `@condorpay/co`
- **THEN** the type SHALL resolve without error
