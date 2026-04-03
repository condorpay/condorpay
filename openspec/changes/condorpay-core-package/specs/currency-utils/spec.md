## ADDED Requirements

### Requirement: formatAmount utility function
The package SHALL export a `formatAmount(amount: Amount, locale?: string): string` function that formats a monetary amount as a human-readable string using the `Intl.NumberFormat` API. If `locale` is omitted, a sensible default SHALL be applied per currency.

#### Scenario: Format COP with default locale
- **WHEN** `formatAmount({ value: '100000', currency: Currency.COP })` is called
- **THEN** the result SHALL be a non-empty string containing the numeric value formatted for Colombian Peso

#### Scenario: Format with explicit locale
- **WHEN** `formatAmount({ value: '1500.50', currency: Currency.MXN }, 'es-MX')` is called
- **THEN** the result SHALL be a non-empty string formatted according to the `es-MX` locale

### Requirement: validateAmount utility function
The package SHALL export a `validateAmount(amount: Amount): void` function that validates an `Amount` object. It SHALL throw a `ValidationError` if:
- `value` is not a valid decimal string (e.g., contains letters, is empty, or has more than 2 decimal places for currencies that require it)
- `value` represents a non-positive number (zero or negative)
- `currency` is not a valid `Currency` enum value

#### Scenario: Valid amount passes validation
- **WHEN** `validateAmount({ value: '100.50', currency: Currency.BRL })` is called
- **THEN** the function SHALL return without throwing

#### Scenario: Zero value throws ValidationError
- **WHEN** `validateAmount({ value: '0', currency: Currency.COP })` is called
- **THEN** the function SHALL throw a `ValidationError` with a field error on `value`

#### Scenario: Negative value throws ValidationError
- **WHEN** `validateAmount({ value: '-50', currency: Currency.MXN })` is called
- **THEN** the function SHALL throw a `ValidationError` with a field error on `value`

#### Scenario: Non-numeric string throws ValidationError
- **WHEN** `validateAmount({ value: 'abc', currency: Currency.COP })` is called
- **THEN** the function SHALL throw a `ValidationError` with a field error on `value`

### Requirement: parseAmount utility function
The package SHALL export a `parseAmount(value: string, currency: Currency): Amount` function that constructs a validated `Amount` from a string value and currency. It SHALL call `validateAmount` internally and propagate any `ValidationError`.

#### Scenario: Valid inputs return Amount
- **WHEN** `parseAmount('250.00', Currency.PEN)` is called
- **THEN** the function SHALL return `{ value: '250.00', currency: Currency.PEN }`

#### Scenario: Invalid value throws ValidationError
- **WHEN** `parseAmount('', Currency.CLP)` is called
- **THEN** the function SHALL throw a `ValidationError`

### Requirement: Currency utils exported from package root
`formatAmount`, `validateAmount`, and `parseAmount` SHALL all be re-exported from the package's main entry point.

#### Scenario: Single import path for utils
- **WHEN** a consumer writes `import { formatAmount, validateAmount, parseAmount } from '@condorpay/core'`
- **THEN** all symbols SHALL resolve without error
