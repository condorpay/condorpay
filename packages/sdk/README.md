# @condorpay/sdk

Unified **CondorPay** SDK for LATAM instant payments: one install gives you shared types and HTTP primitives from [`@condorpay/core`](https://www.npmjs.com/package/@condorpay/core), plus Colombia (Bre-B EMVCo QR and Wompi) from [`@condorpay/co`](https://www.npmjs.com/package/@condorpay/co), exposed through a single `CondorPay` client.

## Requirements

- **Node.js** 20 or later

## Install

```bash
npm install @condorpay/sdk
```

```bash
pnpm add @condorpay/sdk
```

```bash
yarn add @condorpay/sdk
```

## Usage

The main entry re-exports the public API of `@condorpay/core` and exports the `CondorPay` class. Use `country: "co"` together with your Wompi (and optional Bre-B) settings:

```ts
import { CondorPay, Currency, CondorPayError } from "@condorpay/sdk";

const cp = new CondorPay({
	country: "co",
	wompi: { publicKey: "...", privateKey: "..." },
});

const qr = cp.co.generateQr({
	merchantName: "My Store",
	merchantCity: "Bogotá",
	merchantAccountId: "123456789",
});
```

### Colombia-only subpath (`@condorpay/sdk/co`)

For tree-shaking or imports that mirror the internal package:

```ts
import { CondorPayCo, generateQr, WompiPaymentLinkStatus } from "@condorpay/sdk/co";
```

## Package entry points

| Import | Contents |
| --- | --- |
| `@condorpay/sdk` | Core types/errors, `CondorPay`, and everything re-exported from `@condorpay/core` |
| `@condorpay/sdk/co` | Full Colombia module (`@condorpay/co` barrel) |

## License

MIT
