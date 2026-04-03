## 1. Package Scaffold

- [x] 1.1 Create `packages/co` directory and scaffold `package.json` with `name: "@condorpay/co"`, `peerDependencies: { "@condorpay/core": "*" }`, dual ESM+CJS exports, `engines: { node: ">=20" }`, zero runtime dependencies
- [x] 1.2 Create `tsconfig.json`, `tsconfig.esm.json`, `tsconfig.cjs.json` mirroring `@condorpay/core` build pattern (strict mode, ES2022 target, NodeNext/CommonJS outputs)
- [x] 1.3 Create `project.json` with Nx `build` and `test` targets (`nx:run-commands` calling `tsc` for both ESM and CJS, plus `dist/cjs/package.json` injection; `vitest run` for tests)
- [x] 1.4 Create `vitest.config.ts`
- [x] 1.5 Add `@condorpay/co` path mapping to workspace `tsconfig.base.json` (`packages/co/src/index.ts`)

## 2. Bre-B QR — Types and Interfaces

- [x] 2.1 Create `src/breb/types.ts` — export `BrebQrOptions` interface and `BrebQrResult` interface
- [x] 2.2 Create `src/breb/breb-merchant-config.ts` — export `BrebMerchantConfig` interface

## 3. Bre-B QR — CRC16-CCITT

- [x] 3.1 Create `src/breb/crc16.ts` — implement the 256-entry precomputed lookup table for CRC16-CCITT (polynomial `0x1021`, initial value `0xFFFF`)
- [x] 3.2 Export `crc16(input: string): string` — returns 4-char uppercase hex
- [x] 3.3 Export `validateCrc(payload: string): boolean` — checks last 4 chars against computed CRC of preceding content

## 4. Bre-B QR — EMVCo TLV Payload Builder

- [x] 4.1 Create `src/breb/tlv.ts` — implement `encodeTlv(tag: string, value: string): string` helper (zero-pads tag to 2 digits, length to 2 digits)
- [x] 4.2 Create `src/breb/payload.ts` — implement `buildPayload(options: BrebQrOptions): string`
- [x] 4.3 Encode mandatory tags: `00` (Payload Format Indicator `"01"`), `01` (Point of Initiation `"11"` static / `"12"` dynamic), `52` (MCC), `53` (Currency `"170"`), `58` (Country `"CO"`), `59` (Merchant Name), `60` (Merchant City)
- [x] 4.4 Encode tag `26` (Merchant Account Information) containing Bre-B merchant account ID sub-TLV (`01` = account ID)
- [x] 4.5 Encode optional tag `54` (Transaction Amount) when `transactionAmount` is provided
- [x] 4.6 Encode optional tag `62` (Additional Data) with `05` sub-tag (Reference Label) when `additionalData.referenceLabel` is provided
- [x] 4.7 Append tag `6304` + CRC16 of full payload-so-far (CRC field value is CRC of string including `"6304"` prefix)

## 5. Bre-B QR — SVG QR Code Generator

- [x] 5.1 Create `src/breb/qr-matrix.ts` — implement QR code matrix encoder: data encoding (byte mode), error correction (Reed-Solomon, ECC level M), masking pattern selection, and module matrix construction
- [x] 5.2 Create `src/breb/qr-svg.ts` — implement `matrixToSvg(matrix: boolean[][]): string` that renders the QR matrix as an inline SVG using `<rect>` elements (viewBox-based, no fixed pixel size)
- [x] 5.3 Create `src/breb/breb-qr.ts` — implement and export `generateQr(options: BrebQrOptions): BrebQrResult` combining `buildPayload` → `qr-matrix` → `qr-svg`
- [x] 5.4 Create `src/breb/index.ts` — re-export `generateQr`, `buildPayload`, `crc16`, `validateCrc`, and all Bre-B types

## 6. Wompi — Types and Interfaces

- [x] 6.1 Create `src/wompi/types.ts` — export `WompiConfig`, `CreatePaymentLinkRequest`, `WompiPaymentLink`, `WompiPaymentLinkStatus`, `CreatePayoutRequest`, `BankAccountInfo`, `BankAccountType`, `IdType`, `WompiPayout`, `WompiPayoutStatus`, `WompiWebhookEvent`, `WompiTransaction`, `WompiTransactionStatus`

## 7. Wompi — WompiClient

- [x] 7.1 Create `src/wompi/wompi-client.ts` — implement `WompiClient` class constructing an `HttpClient` with `baseUrl` and Bearer token headers
- [x] 7.2 Implement `createPaymentLink(request: CreatePaymentLinkRequest): Promise<WompiPaymentLink>` — validate COP currency, call `POST /payment_links`, return typed response
- [x] 7.3 Implement `getPaymentLink(id: string): Promise<WompiPaymentLink>` — call `GET /payment_links/:id`, return typed response
- [x] 7.4 Implement `createPayout(request: CreatePayoutRequest): Promise<WompiPayout>` — validate COP currency, call `POST /transfers`, return typed response
- [x] 7.5 Implement `getPayout(id: string): Promise<WompiPayout>` — call `GET /transfers/:id`, return typed response

## 8. Wompi — Webhook Validation

- [x] 8.1 Create `src/wompi/webhook.ts` — implement `validateWompiWebhook(event, signature, eventKey): Promise<boolean>` using `globalThis.crypto.subtle` (HMAC-SHA256)
- [x] 8.2 Validate `eventKey` is non-empty — throw `ValidationError` with field error on `eventKey` if blank
- [x] 8.3 Handle structurally malformed events gracefully — return `false` instead of throwing
- [x] 8.4 Create `src/wompi/index.ts` — re-export `WompiClient`, `validateWompiWebhook`, and all Wompi types

## 9. CondorPayCo Provider

- [x] 9.1 Create `src/provider/condorpay-co.ts` — implement `CondorPayCo extends AbstractPaymentProvider` with `readonly name = "condorpay-co"`
- [x] 9.2 Accept `CondorPayCoConfig` in constructor; instantiate `WompiClient` internally; optionally hold `BrebMerchantConfig`
- [x] 9.3 Implement `createPayment(request: PaymentRequest): Promise<PaymentResponse>` — validate COP, call `WompiClient.createPaymentLink`, map to `PaymentResponse` with `metadata.wompiUrl`
- [x] 9.4 Implement `getPayment(id: string): Promise<PaymentResponse>` — call `WompiClient.getPaymentLink`, map `WompiPaymentLinkStatus` to `PaymentStatus`
- [x] 9.5 Implement `cancelPayment(id: string): Promise<PaymentResponse>` — throw `CondorPayError` per spec (expired → `PAYMENT_ALREADY_CANCELLED`; active → unsupported)
- [x] 9.6 Implement `generateQr(options: BrebQrOptions): BrebQrResult` — delegate to `BrebQr.generateQr`
- [x] 9.7 Export `CondorPayCoConfig` and `BrebMerchantConfig` interfaces from provider module
- [x] 9.8 Create `src/provider/index.ts` — re-export `CondorPayCo` and config interfaces

## 10. Package Entry Points

- [x] 10.1 Create `src/index.ts` — barrel re-exporting everything from `breb`, `wompi`, and `provider` sub-modules
- [x] 10.2 Create `src/breb-entry.ts` — subpath barrel for `@condorpay/co/breb` (Bre-B exports only)
- [x] 10.3 Create `src/wompi-entry.ts` — subpath barrel for `@condorpay/co/wompi` (Wompi exports only)
- [x] 10.4 Add subpath export entries to `package.json`: `"./breb"` and `"./wompi"` pointing to respective ESM + CJS outputs

## 11. Tests

- [x] 11.1 Write unit tests for `crc16` — verify against EMVCo reference vectors and edge cases
- [x] 11.2 Write unit tests for `validateCrc` — valid and tampered payloads
- [x] 11.3 Write unit tests for `buildPayload` — static QR, dynamic QR with amount, optional tags
- [x] 11.4 Write unit tests for `generateQr` — result has `payload` and `svg`, `validateCrc(result.payload)` returns `true`
- [x] 11.5 Write unit tests for `WompiClient` — mock `fetch`, test `createPaymentLink`, `getPaymentLink`, `createPayout`, `getPayout`, currency validation, error mapping
- [x] 11.6 Write unit tests for `validateWompiWebhook` — valid HMAC, invalid signature, empty event key, malformed event
- [x] 11.7 Write unit tests for `CondorPayCo` — mock `WompiClient`, test `createPayment`, `getPayment`, `cancelPayment` status mapping, `generateQr` delegation
- [x] 11.8 Write unit tests for all enums — verify values for `WompiPaymentLinkStatus`, `WompiTransactionStatus`, `WompiPayoutStatus`, `BankAccountType`, `IdType`

## 12. Build & Publish Config

- [x] 12.1 Run `nx build co` — verify ESM and CJS outputs are produced under `dist/` with no TypeScript errors
- [x] 12.2 Run `nx test co` — verify all tests pass
- [x] 12.3 Verify `dist/cjs/package.json` is written with `{"type":"commonjs"}` as part of the build
- [x] 12.4 Confirm `files` field in `package.json` includes only `dist/` and `README.md`
