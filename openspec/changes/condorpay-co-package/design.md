## Context

`@condorpay/co` is the first country package in the condorpay SDK. It targets the Colombian payments ecosystem, which has two dominant integration points:

1. **Bre-B** — Colombia's central-bank-mandated interoperable QR payment rail (Banco de la República). Payments are initiated by displaying an EMVCo-compliant QR code that any participating bank app can scan. The payload is a TLV-encoded string with a CRC16-CCITT checksum, and the QR graphic is rendered by the merchant's frontend.

2. **Wompi** — The leading Colombian payment gateway (owned by Bancolombia). It provides hosted payment links, webhook event delivery, and a transfers API for payouts/dispersion to third-party bank accounts.

`@condorpay/core` is already implemented and provides: `HttpClient`, `AbstractPaymentProvider`, `Amount`/`Currency`, `CondorPayError` hierarchy, and currency utils.

## Goals / Non-Goals

**Goals:**
- Implement EMVCo QR TLV payload builder and CRC16-CCITT in pure TypeScript (zero deps)
- Generate SVG QR code entirely in-process without any image library
- Implement Wompi REST API client (payment links + payouts) using `@condorpay/core`'s `HttpClient`
- Implement Wompi webhook HMAC-SHA256 validation using the Web Crypto API
- Expose a `CondorPayCo` class that unifies both integrations under `AbstractPaymentProvider`
- Dual ESM + CJS output via `tsc`, matching `@condorpay/core` build pattern
- Full test coverage with Vitest

**Non-Goals:**
- Support for other Colombian gateways (PSE direct, Nequi API, etc.) — future changes
- QR code scanning / decoding
- Webhooks other than Wompi (Bre-B has no push webhook model)
- Retry logic (inherited from `@condorpay/core`'s design; `maxRetries` can be enabled by consumers)
- Authentication flows beyond API key / event key passing (credentials are constructor options)

## Decisions

### 1. EMVCo TLV encoding in pure TypeScript

**Decision:** Implement the TLV (Tag-Length-Value) encoding algorithm directly — no QR library, no `emvco` npm package.

**Rationale:** Zero dependencies is a hard constraint. The EMVCo QR spec's encoding is straightforward: each field is `{2-digit tag}{2-digit length padded}{value}`. The full spec payload for Bre-B fits in ~200 chars, well within URL/QR capacity.

**Alternatives considered:**
- `node-emvco-qr`: Adds a runtime dep, abandoned-ish, not browser-compatible
- Encoding as a hex blob: Incorrect — EMVCo QR uses ASCII strings, not binary TLV

### 2. CRC16-CCITT in pure TypeScript (lookup-table approach)

**Decision:** Use the standard 256-entry precomputed lookup table for CRC16-CCITT (polynomial `0x1021`, initial value `0xFFFF`).

**Rationale:** The lookup-table approach is O(n) in string length, fast enough for payloads under 1KB, and trivially portable to browser and Node without any C extension or WASM.

**Alternatives considered:**
- Bit-by-bit CRC computation: Correct but ~16× slower; acceptable but unnecessary
- Using a `crc` npm package: Adds a dependency

### 3. Zero-dependency SVG QR code generation

**Decision:** Implement a minimal QR code matrix generator (Reed-Solomon error correction, data encoding, masking) and output SVG `<rect>` elements. The generator will be a self-contained module inside the `breb-qr` submodule.

**Rationale:** The main alternative is `qrcode` (npm) which is excellent but adds a runtime dependency and ~50KB. Since QR matrix generation for short payloads (ECC level M, version ≤5) is well-defined and finite, a focused implementation is feasible and keeps the package self-contained.

**Alternatives considered:**
- `qrcode` npm package: Ideal quality but violates zero-dep constraint
- Canvas-based rendering: Browser-only; SVG is universal
- Returning only the payload string and delegating QR rendering to consumers: Valid escape hatch — `BrebQr.generate()` returns both `{ payload: string; svg: string }` so consumers can use their own renderer if preferred

### 4. Wompi webhook validation via Web Crypto API

**Decision:** Use `globalThis.crypto.subtle.importKey` + `sign` (HMAC-SHA256) instead of Node's `crypto` module.

**Rationale:** `crypto.subtle` is available in Node.js 20+ (stable) and all modern browsers, matching the stated target. Using Node's built-in `crypto` module would make the package Node-only and break browser support.

**Alternatives considered:**
- Node `crypto.createHmac`: Works in Node but not browsers
- A polyfill: Adds a dependency
- Manual HMAC: Insecure; not worth implementing

### 5. Module structure: flat modules vs. nested subpackage exports

**Decision:** Export via subpath exports (`@condorpay/co/breb`, `@condorpay/co/wompi`) in addition to the root barrel (`@condorpay/co`).

**Rationale:** Consumers who only need Bre-B QR shouldn't import Wompi's HTTP client setup, and vice versa. Subpath exports enable tree-shaking and explicit dependency expression. The root barrel re-exports everything for convenience.

**Alternatives considered:**
- Root barrel only: Simple but inhibits tree-shaking
- Separate npm packages (`@condorpay/breb`, `@condorpay/wompi`): Overkill for v1; complicates versioning

### 6. `CondorPayCo` as the unified provider

**Decision:** `CondorPayCo extends AbstractPaymentProvider` and wires `BrebQr` and `WompiClient` internally. The constructor accepts a `CondorPayCoConfig` object with Wompi API keys and optional Bre-B merchant info.

**Rationale:** Country packages need a single entry point for SDK consumers. `CondorPayCo.createPayment()` dispatches to Wompi (payment link) by default; `CondorPayCo.generateQr()` produces a Bre-B QR. This covers the two dominant Colombian payment initiation flows.

## Risks / Trade-offs

- **SVG QR correctness** → Mitigation: Test generated QRs against known-good reference payloads and use a reference decoder in tests. The QR matrix generator will be unit-tested at the bit level.
- **EMVCo spec coverage** → Mitigation: Support the required Bre-B TLV tags (IDs 00, 01, 26, 52, 53, 54, 58, 59, 60, 62, 63). Document which optional tags are supported vs. omitted.
- **Web Crypto API async signature** → Mitigation: `validateWebhook()` is async; document this clearly. Synchronous HMAC is not possible with Web Crypto.
- **Wompi API changes** → Mitigation: Wompi types are isolated in `src/wompi/types.ts`; updating them doesn't affect the public API surface.
- **QR module size** → The QR matrix generator adds ~3–4KB minified. Subpath exports allow consumers who only need Wompi to exclude it.

## Migration Plan

Net-new package — no migration needed. Consumers install `@condorpay/co` and provide Wompi credentials and optional Bre-B merchant metadata.

## Open Questions

- Should `generateQr()` accept an optional ECC level parameter, or default to `M` (15% recovery) as required by Bre-B? → Default to `M`; expose the option for future flexibility.
- Bre-B merchant category code (MCC): require it in config or make it optional (default `0000`)? → Make it optional with default `0000` to reduce onboarding friction.
