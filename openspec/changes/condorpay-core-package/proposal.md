## Why

The condorpay SDK needs a shared foundation that all country-specific payment packages can build on. Without a common core, each package would duplicate HTTP logic, error handling, type definitions, and utility code — making the SDK hard to maintain and inconsistent across LATAM markets.

## What Changes

- New `@condorpay/core` package introduced to the monorepo
- Defines shared TypeScript types and interfaces (`Amount`, `Currency`, `PaymentStatus`, `PaymentRequest`, `PaymentResponse`, etc.)
- Implements a fetch-based HTTP client with zero external dependencies
- Introduces `AbstractPaymentProvider` — the interface all country packages must implement
- Provides structured error classes (`CondorPayError`, `NetworkError`, `ValidationError`)
- Ships utility functions for currency formatting and amount validation
- **No breaking changes** — this is a net-new package; no existing packages are modified

## Capabilities

### New Capabilities

- `shared-types`: Core TypeScript types and interfaces shared across the SDK (Amount, Currency, PaymentStatus, PaymentRequest, PaymentResponse, etc.)
- `http-client`: Fetch-based HTTP client with request/response lifecycle, timeout, and retry support — no external dependencies
- `payment-provider`: `AbstractPaymentProvider` interface defining the contract all country packages must implement
- `error-handling`: Structured error hierarchy (`CondorPayError`, `NetworkError`, `ValidationError`) with consistent error codes and messages
- `currency-utils`: Utility functions for currency formatting and amount validation across LATAM currencies

### Modified Capabilities

## Impact

- New package: `packages/core` (published as `@condorpay/core`)
- All future country packages (`@condorpay/co`, `@condorpay/mx`, etc.) will declare `@condorpay/core` as a peer dependency
- Targets Node.js 20+ and modern browsers (no polyfills required)
- TypeScript 6, strict mode, zero runtime dependencies
- Consumed via ESM and CJS dual build output
