import { describe, expect, it } from "vitest";
import type { Amount } from "./amount.js";
import { Currency } from "./currency.js";
import type { PaymentRequest, PaymentResponse } from "./payment.js";
import { PaymentStatus } from "./payment.js";

describe("Currency", () => {
	it("contains all seven LATAM currency codes", () => {
		expect(Currency.COP).toBe("COP");
		expect(Currency.MXN).toBe("MXN");
		expect(Currency.BRL).toBe("BRL");
		expect(Currency.ARS).toBe("ARS");
		expect(Currency.CLP).toBe("CLP");
		expect(Currency.PEN).toBe("PEN");
		expect(Currency.UYU).toBe("UYU");
		expect(Object.keys(Currency)).toHaveLength(7);
	});
});

describe("PaymentStatus", () => {
	it("contains non-terminal states", () => {
		expect(PaymentStatus.PENDING).toBe("PENDING");
		expect(PaymentStatus.PROCESSING).toBe("PROCESSING");
	});

	it("contains terminal states", () => {
		expect(PaymentStatus.COMPLETED).toBe("COMPLETED");
		expect(PaymentStatus.FAILED).toBe("FAILED");
		expect(PaymentStatus.CANCELLED).toBe("CANCELLED");
		expect(PaymentStatus.REFUNDED).toBe("REFUNDED");
	});
});

describe("Amount type", () => {
	it("accepts a valid decimal string amount", () => {
		const amount: Amount = { value: "100.50", currency: Currency.COP };
		expect(amount.value).toBe("100.50");
		expect(amount.currency).toBe(Currency.COP);
	});

	it("accepts an integer string amount", () => {
		const amount: Amount = { value: "500", currency: Currency.MXN };
		expect(amount.value).toBe("500");
	});
});

describe("PaymentRequest interface", () => {
	it("accepts a minimal valid request", () => {
		const req: PaymentRequest = {
			id: "pay-001",
			amount: { value: "100.00", currency: Currency.COP },
			description: "Test payment",
			idempotencyKey: "idem-001",
		};
		expect(req.id).toBe("pay-001");
		expect(req.metadata).toBeUndefined();
	});

	it("accepts optional metadata", () => {
		const req: PaymentRequest = {
			id: "pay-002",
			amount: { value: "50.00", currency: Currency.MXN },
			description: "Payment with metadata",
			idempotencyKey: "idem-002",
			metadata: { orderId: "order-123" },
		};
		expect(req.metadata?.orderId).toBe("order-123");
	});
});

describe("PaymentResponse interface", () => {
	it("accepts a valid response", () => {
		const resp: PaymentResponse = {
			id: "pay-001",
			status: PaymentStatus.COMPLETED,
			amount: { value: "100.00", currency: Currency.COP },
			createdAt: "2026-04-02T00:00:00Z",
			updatedAt: "2026-04-02T00:01:00Z",
		};
		expect(resp.status).toBe(PaymentStatus.COMPLETED);
		expect(resp.metadata).toBeUndefined();
	});
});
