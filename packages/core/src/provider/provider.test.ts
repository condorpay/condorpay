import { describe, expect, it } from "vitest";
import { HttpClient } from "../http/http-client.js";
import { Currency } from "../types/currency.js";
import type { PaymentRequest, PaymentResponse } from "../types/payment.js";
import { PaymentStatus } from "../types/payment.js";
import { AbstractPaymentProvider } from "./abstract-payment-provider.js";

class TestProvider extends AbstractPaymentProvider {
	readonly name = "test-provider";

	async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
		return {
			id: request.id,
			status: PaymentStatus.PENDING,
			amount: request.amount,
			createdAt: "2026-04-02T00:00:00Z",
			updatedAt: "2026-04-02T00:00:00Z",
		};
	}

	async getPayment(id: string): Promise<PaymentResponse> {
		return {
			id,
			status: PaymentStatus.COMPLETED,
			amount: { value: "100.00", currency: Currency.COP },
			createdAt: "2026-04-02T00:00:00Z",
			updatedAt: "2026-04-02T00:01:00Z",
		};
	}

	async cancelPayment(id: string): Promise<PaymentResponse> {
		return {
			id,
			status: PaymentStatus.CANCELLED,
			amount: { value: "100.00", currency: Currency.COP },
			createdAt: "2026-04-02T00:00:00Z",
			updatedAt: "2026-04-02T00:02:00Z",
		};
	}
}

describe("AbstractPaymentProvider", () => {
	const http = new HttpClient({ baseUrl: "https://api.example.com" });
	const provider = new TestProvider(http);

	it("exposes the name property declared by subclass", () => {
		expect(provider.name).toBe("test-provider");
	});

	it("has access to the http client via this.http", () => {
		expect((provider as unknown as { http: HttpClient }).http).toBe(http);
	});

	it("createPayment returns a PaymentResponse", async () => {
		const request: PaymentRequest = {
			id: "pay-001",
			amount: { value: "100.00", currency: Currency.COP },
			description: "Test",
			idempotencyKey: "idem-001",
		};
		const response = await provider.createPayment(request);
		expect(response.id).toBe("pay-001");
		expect(response.status).toBe(PaymentStatus.PENDING);
	});

	it("getPayment returns a PaymentResponse", async () => {
		const response = await provider.getPayment("pay-001");
		expect(response.id).toBe("pay-001");
		expect(response.status).toBe(PaymentStatus.COMPLETED);
	});

	it("cancelPayment returns a PaymentResponse with CANCELLED status", async () => {
		const response = await provider.cancelPayment("pay-001");
		expect(response.status).toBe(PaymentStatus.CANCELLED);
	});
});
