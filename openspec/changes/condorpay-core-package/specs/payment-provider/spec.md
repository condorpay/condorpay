## ADDED Requirements

### Requirement: AbstractPaymentProvider abstract class
The package SHALL export an `AbstractPaymentProvider` abstract class that defines the integration contract for all country-specific payment packages.

#### Scenario: Cannot be instantiated directly
- **WHEN** a consumer attempts to instantiate `AbstractPaymentProvider` directly
- **THEN** the TypeScript compiler SHALL reject the instantiation with a compile-time error

### Requirement: Abstract payment lifecycle methods
`AbstractPaymentProvider` SHALL declare the following abstract methods that subclasses MUST implement:
- `createPayment(request: PaymentRequest): Promise<PaymentResponse>`
- `getPayment(id: string): Promise<PaymentResponse>`
- `cancelPayment(id: string): Promise<PaymentResponse>`

#### Scenario: Subclass must implement all abstract methods
- **WHEN** a consumer extends `AbstractPaymentProvider` without implementing all abstract methods
- **THEN** the TypeScript compiler SHALL produce an error indicating the missing implementations

#### Scenario: Implemented subclass compiles cleanly
- **WHEN** a consumer extends `AbstractPaymentProvider` and implements all abstract methods with correct signatures
- **THEN** the TypeScript compiler SHALL accept the subclass without error

### Requirement: Protected HttpClient access
`AbstractPaymentProvider` SHALL accept an `HttpClient` instance via its constructor and expose it as a `protected` property named `http`. Subclasses SHALL use `this.http` to make API calls.

#### Scenario: HttpClient accessible in subclass
- **WHEN** a subclass method calls `this.http.post(...)`
- **THEN** the TypeScript compiler SHALL resolve `this.http` as an `HttpClient` instance without error

### Requirement: Provider name property
`AbstractPaymentProvider` SHALL require subclasses to declare a `readonly name: string` property identifying the provider (e.g., `"condorpay-co"`).

#### Scenario: Name property required on subclass
- **WHEN** a consumer extends `AbstractPaymentProvider` without declaring `name`
- **THEN** the TypeScript compiler SHALL produce an error

#### Scenario: Name property accessible on instance
- **WHEN** a consumer accesses `.name` on a concrete provider instance
- **THEN** the value SHALL be the string declared by the subclass
