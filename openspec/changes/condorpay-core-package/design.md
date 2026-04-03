## Context

The condorpay SDK is a unified instant payments library for LATAM markets. Country-specific packages (`@condorpay/co`, `@condorpay/mx`, etc.) will handle market-specific payment rails, but they need a shared foundation to avoid duplicating cross-cutting concerns. This package is the zero-dependency foundation layer.

There are currently no existing packages in the monorepo. `@condorpay/core` is the first package and establishes architectural patterns all future packages will follow.

## Goals / Non-Goals

**Goals:**
- Define a stable set of shared TypeScript types and interfaces for the entire SDK
- Provide a fetch-based HTTP client suitable for Node.js 20+ and modern browsers
- Define `AbstractPaymentProvider` as the integration contract for all country packages
- Establish a consistent, structured error hierarchy
- Ship currency/amount utilities for LATAM currencies
- Zero runtime dependencies; TypeScript 6 strict mode; dual ESM+CJS output

**Non-Goals:**
- Payment processing logic (belongs in country packages)
- Authentication/token management beyond passing credentials into HTTP requests
- React or framework-specific bindings
- Support for Node.js < 20 or legacy browsers
- Retry logic with exponential backoff in v1 (simple single-retry on network error only)

## Decisions

### 1. Fetch-based HTTP client over axios/got/ky

**Decision:** Use the native `fetch` API, available in Node.js 18+ (stable in 20+) and all modern browsers.

**Rationale:** Zero dependencies is a hard constraint. Native fetch eliminates the need for any HTTP library, keeps the bundle minimal, and is available on both target runtimes without polyfills.

**Alternatives considered:**
- `axios`: Popular but adds ~13KB and a runtime dependency
- `got`: Node-only, doesn't meet browser target
- `undici`: Node-only, adds a dependency

### 2. Abstract class over interface for `AbstractPaymentProvider`

**Decision:** Use an abstract TypeScript class rather than a plain `interface`.

**Rationale:** An abstract class allows shipping default implementations (e.g., a shared `request()` method that delegates to the HTTP client) alongside the contract. Country packages extend the class and override only what differs. A plain interface would require every implementor to re-implement shared plumbing.

**Alternatives considered:**
- Pure `interface`: More flexible but forces duplication in every country package
- Mixin pattern: Overly complex for this use case

### 3. Structured error hierarchy with error codes

**Decision:** `CondorPayError` is the base class. `NetworkError` and `ValidationError` extend it. Every error carries a `code` (string enum) and `statusCode` (HTTP code where applicable).

**Rationale:** Callers need to distinguish error types programmatically (e.g., retry on `NetworkError`, surface `ValidationError` to users). A flat error with a string message makes this fragile.

**Alternatives considered:**
- Single error class with a `type` discriminator field: Less idiomatic; breaks `instanceof` checks
- Union types instead of class hierarchy: Doesn't work well with `throw`/`catch`

### 4. Dual ESM + CJS build output

**Decision:** Build with `tsc` only (no bundler) targeting both ESM and CJS via `package.json` `exports` field.

**Rationale:** No bundler dependency keeps the build pipeline simple. TypeScript 6 supports `--module nodenext` with subpath exports cleanly. Library consumers (both ESM and CJS) get optimal output.

**Alternatives considered:**
- tsup / rollup: More capable but adds dev dependencies and complexity
- ESM-only: Breaks CJS consumers (common in older toolchains)

### 5. Amount represented as `{ value: string; currency: Currency }`

**Decision:** Monetary amounts use a string `value` (e.g., `"100.50"`) rather than `number`.

**Rationale:** Floating-point arithmetic is unreliable for money. Strings preserve precision and are the format most LATAM payment APIs use natively. Conversion to/from numbers is an explicit consumer choice.

**Alternatives considered:**
- `number`: Precision loss on large amounts or certain decimal values
- `bigint` in minor units: Correct but unfamiliar; requires callers to know decimal precision per currency

## Risks / Trade-offs

- **Native fetch availability** → Mitigation: Node.js 20+ is the stated minimum; no action needed. Document clearly in README.
- **String amounts require consumer discipline** → Mitigation: `validateAmount()` utility enforces the format; `ValidationError` is thrown on invalid input at provider boundaries.
- **Abstract class creates tighter coupling than interface** → Mitigation: The abstract class exposes only a single protected `request()` helper; the rest of the contract is abstract methods. Country packages are not forced to use `request()`.
- **No retry logic in v1** → Mitigation: The HTTP client will expose a `maxRetries` option (defaulting to 0) so it can be enabled later without a breaking API change.

## Migration Plan

This is a new package with no existing consumers — no migration needed. When country packages are introduced, they will declare `@condorpay/core` as a peer dependency and extend `AbstractPaymentProvider`.

## Open Questions

- Should `Currency` be an open string union (e.g., `string & {}`) to allow custom currencies, or a closed enum of supported LATAM currencies? → Lean toward a closed enum for v1 to enforce correctness; open it up if/when needed.
- Should the HTTP client support request interceptors in v1? → Out of scope; can be added as a non-breaking enhancement.
