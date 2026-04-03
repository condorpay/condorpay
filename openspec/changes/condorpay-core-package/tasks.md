## 1. Package Scaffold

- [ ] 1.1 Generate the `@condorpay/core` library with `nx g @nx/node:library` (or equivalent) under `packages/core`
- [ ] 1.2 Configure `package.json`: set `name: "@condorpay/core"`, add `exports` map for ESM and CJS entry points, set `engines: { node: ">=20" }`
- [ ] 1.3 Configure `tsconfig.json` with `strict: true`, `target: ES2022`, `module: NodeNext`, and `moduleResolution: NodeNext`
- [ ] 1.4 Verify zero runtime dependencies in `package.json` (`dependencies` field must be empty or absent)

## 2. Shared Types

- [ ] 2.1 Create `src/types/currency.ts` — export `Currency` enum with all seven LATAM currency codes
- [ ] 2.2 Create `src/types/amount.ts` — export `Amount` type (`{ value: string; currency: Currency }`)
- [ ] 2.3 Create `src/types/payment.ts` — export `PaymentStatus` enum, `PaymentRequest` interface, and `PaymentResponse` interface
- [ ] 2.4 Create `src/types/index.ts` — re-export all types from the above files

## 3. Error Handling

- [ ] 3.1 Create `src/errors/error-codes.ts` — export `ErrorCode` enum with all seven initial codes
- [ ] 3.2 Create `src/errors/condorpay-error.ts` — export `CondorPayError` extending `Error` with `code` and optional `cause`
- [ ] 3.3 Create `src/errors/network-error.ts` — export `NetworkError` extending `CondorPayError` with `statusCode` and `responseBody`
- [ ] 3.4 Create `src/errors/validation-error.ts` — export `ValidationError` extending `CondorPayError` with `fields: Record<string, string>`
- [ ] 3.5 Create `src/errors/index.ts` — re-export all error classes and `ErrorCode`

## 4. HTTP Client

- [ ] 4.1 Create `src/http/types.ts` — export `HttpClientOptions` interface
- [ ] 4.2 Create `src/http/http-client.ts` — implement `HttpClient` class using native `fetch` with `baseUrl`, `defaultHeaders`, and `timeoutMs` support
- [ ] 4.3 Implement `get<T>()`, `post<T>()`, `put<T>()`, `patch<T>()`, `delete<T>()` methods on `HttpClient`
- [ ] 4.4 Implement request timeout using `AbortController` — throw `NetworkError` with `ErrorCode.REQUEST_TIMEOUT` on abort
- [ ] 4.5 Implement non-2xx response handling — throw `NetworkError` with the HTTP `statusCode` and raw response body
- [ ] 4.6 Create `src/http/index.ts` — re-export `HttpClient` and `HttpClientOptions`

## 5. AbstractPaymentProvider

- [ ] 5.1 Create `src/provider/abstract-payment-provider.ts` — implement `AbstractPaymentProvider` abstract class
- [ ] 5.2 Add constructor accepting `HttpClient`, storing it as `protected readonly http: HttpClient`
- [ ] 5.3 Declare `abstract readonly name: string` property
- [ ] 5.4 Declare abstract methods: `createPayment()`, `getPayment()`, `cancelPayment()` with correct signatures
- [ ] 5.5 Create `src/provider/index.ts` — re-export `AbstractPaymentProvider`

## 6. Currency Utilities

- [ ] 6.1 Create `src/utils/currency-utils.ts` — implement `validateAmount(amount: Amount): void`
- [ ] 6.2 Implement `parseAmount(value: string, currency: Currency): Amount` — validates then returns the `Amount`
- [ ] 6.3 Implement `formatAmount(amount: Amount, locale?: string): string` using `Intl.NumberFormat`
- [ ] 6.4 Create `src/utils/index.ts` — re-export all three utility functions

## 7. Package Entry Point

- [ ] 7.1 Create `src/index.ts` — re-export everything from `types`, `errors`, `http`, `provider`, and `utils` sub-modules
- [ ] 7.2 Verify all public symbols are accessible via a single `import ... from '@condorpay/core'` statement

## 8. Tests

- [ ] 8.1 Write unit tests for `Currency` enum, `Amount` type, `PaymentStatus` enum, `PaymentRequest`, and `PaymentResponse`
- [ ] 8.2 Write unit tests for all error classes — verify `instanceof` chain and field contents
- [ ] 8.3 Write unit tests for `HttpClient` — mock `fetch`, test success path, 4xx/5xx error handling, and timeout
- [ ] 8.4 Write unit tests for `AbstractPaymentProvider` — verify subclass contract via a minimal test implementation
- [ ] 8.5 Write unit tests for `validateAmount`, `parseAmount`, and `formatAmount` — cover all validation scenarios from specs

## 9. Build & Publish Config

- [ ] 9.1 Configure Nx `build` target to produce dual ESM + CJS output under `dist/`
- [ ] 9.2 Set `main`, `module`, and `exports` fields in `package.json` to point to the correct `dist/` paths
- [ ] 9.3 Add `files` field to `package.json` to include only `dist/` and `README.md` in the published package
- [ ] 9.4 Run `nx build core` and verify the build succeeds with no TypeScript errors
- [ ] 9.5 Run `nx test core` and verify all tests pass
