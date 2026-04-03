## ADDED Requirements

### Requirement: HttpClient class
The package SHALL export an `HttpClient` class that wraps the native `fetch` API. It MUST have zero runtime dependencies and MUST work in Node.js 20+ and modern browsers.

#### Scenario: Instantiation with base URL
- **WHEN** a consumer instantiates `HttpClient` with `{ baseUrl: 'https://api.example.com' }`
- **THEN** the instance SHALL be created without error

### Requirement: HTTP method support
`HttpClient` SHALL support `GET`, `POST`, `PUT`, `PATCH`, and `DELETE` methods via typed methods: `get<T>()`, `post<T>()`, `put<T>()`, `patch<T>()`, and `delete<T>()`. Each method SHALL return a `Promise<T>`.

#### Scenario: GET request returns typed response
- **WHEN** a consumer calls `client.get<MyType>('/endpoint')`
- **THEN** the method SHALL return a `Promise<MyType>` resolving with the parsed JSON body on a 2xx response

#### Scenario: POST request sends JSON body
- **WHEN** a consumer calls `client.post<MyType>('/endpoint', { body: payload })`
- **THEN** the method SHALL send a request with `Content-Type: application/json` and the serialized payload

### Requirement: Default request headers
`HttpClient` SHALL accept a `defaultHeaders` option at construction time. These headers SHALL be merged into every request. Consumer-provided per-request headers SHALL take precedence over defaults.

#### Scenario: Default headers sent on every request
- **WHEN** `HttpClient` is constructed with `defaultHeaders: { 'X-Api-Key': 'secret' }`
- **THEN** every outgoing request SHALL include the `X-Api-Key` header

#### Scenario: Per-request headers override defaults
- **WHEN** a consumer passes `headers: { 'X-Api-Key': 'override' }` on a single request
- **THEN** the per-request value SHALL be used instead of the default

### Requirement: Request timeout
`HttpClient` SHALL support a `timeoutMs` option (default: `30000`). If a response is not received within the timeout, the client SHALL abort the request and throw a `NetworkError` with code `REQUEST_TIMEOUT`.

#### Scenario: Timeout exceeded throws NetworkError
- **WHEN** the server does not respond within `timeoutMs` milliseconds
- **THEN** `HttpClient` SHALL throw a `NetworkError` with `code: 'REQUEST_TIMEOUT'`

### Requirement: Non-2xx response handling
`HttpClient` SHALL throw a `NetworkError` for any HTTP response with a status code outside the 2xx range. The error SHALL include the `statusCode` and the raw response body.

#### Scenario: 4xx response throws NetworkError
- **WHEN** the server responds with a 4xx status code
- **THEN** `HttpClient` SHALL throw a `NetworkError` containing the status code

#### Scenario: 5xx response throws NetworkError
- **WHEN** the server responds with a 5xx status code
- **THEN** `HttpClient` SHALL throw a `NetworkError` containing the status code

### Requirement: HttpClientOptions interface
The package SHALL export an `HttpClientOptions` interface documenting all constructor options: `baseUrl` (string, required), `defaultHeaders` (optional), `timeoutMs` (optional, default 30000).

#### Scenario: Options type is importable
- **WHEN** a consumer imports `HttpClientOptions` from `@condorpay/core`
- **THEN** the symbol SHALL resolve without error
