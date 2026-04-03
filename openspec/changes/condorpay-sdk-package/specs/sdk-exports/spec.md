## ADDED Requirements

### Requirement: Main entry point re-exports core public API
The `condorpay` package's main entry SHALL re-export all public symbols from `@condorpay/core` (types, errors, utilities, `AbstractPaymentProvider`).

#### Scenario: Core types importable from condorpay
- **WHEN** `import { Currency, PaymentStatus, Amount } from "condorpay"` is used
- **THEN** the symbols resolve correctly with full TypeScript types

#### Scenario: Core error classes importable from condorpay
- **WHEN** `import { CondorPayError, NetworkError, ValidationError } from "condorpay"` is used
- **THEN** the error classes are available and instanceof checks work

### Requirement: Main entry point exports CondorPay client
The `condorpay` package's main entry SHALL export the `CondorPay` class and its associated config types.

#### Scenario: CondorPay class importable from main entry
- **WHEN** `import { CondorPay } from "condorpay"` is used
- **THEN** `CondorPay` is a constructable class with correct TypeScript type

### Requirement: Subpath export condorpay/co re-exports Colombia API
The `condorpay/co` subpath SHALL re-export all public symbols from `@condorpay/co` including `CondorPayCo`, Wompi types, Bre-B types, and the `validateWompiWebhook` function.

#### Scenario: CondorPayCo importable from subpath
- **WHEN** `import { CondorPayCo } from "condorpay/co"` is used
- **THEN** `CondorPayCo` resolves with correct TypeScript types

#### Scenario: Wompi and Bre-B types importable from subpath
- **WHEN** `import { WompiPaymentLinkStatus, BrebQrResult } from "condorpay/co"` is used
- **THEN** both types resolve correctly

### Requirement: Package ships both ESM and CJS builds
The `condorpay` package SHALL provide ESM output (`.js` with `"type": "module"`) and CJS output (`dist/cjs/` with injected `{"type":"commonjs"}`) so it works in both Node.js ESM and CJS contexts and with bundlers.

#### Scenario: ESM import resolves correctly
- **WHEN** a Node.js ESM project does `import { CondorPay } from "condorpay"`
- **THEN** the import resolves to the ESM output without errors

#### Scenario: CJS require resolves correctly
- **WHEN** a Node.js CJS project does `require("condorpay")`
- **THEN** the module loads without errors and exports are accessible

### Requirement: Package ships TypeScript declaration files
The `condorpay` package SHALL include `.d.ts` declaration files for all exports so TypeScript consumers get full type information without a separate `@types/condorpay` package.

#### Scenario: TypeScript resolves types from condorpay
- **WHEN** a TypeScript project imports from `"condorpay"` or `"condorpay/co"`
- **THEN** the TypeScript compiler finds declaration files and no `any` types are inferred
