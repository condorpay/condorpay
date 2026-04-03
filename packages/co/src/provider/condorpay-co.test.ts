import {
	CondorPayError,
	Currency,
	ErrorCode,
	PaymentStatus,
	ValidationError,
} from "@condorpay/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { WompiPaymentLink } from "../wompi/types.js";
import { WompiPaymentLinkStatus } from "../wompi/types.js";
import { CondorPayCo } from "./condorpay-co.js";

const BASE_CONFIG = {
	wompi: { publicKey: "pub_test", privateKey: "priv_test" },
};

const MOCK_LINK: WompiPaymentLink = {
	id: "link-001",
	name: "Test",
	url: "https://checkout.wompi.co/l/abc",
	amount: { value: "50000", currency: Currency.COP },
	currency: Currency.COP,
	status: WompiPaymentLinkStatus.ACTIVE,
	createdAt: "2026-04-02T00:00:00Z",
};

describe("CondorPayCo", () => {
	let provider: CondorPayCo;

	beforeEach(() => {
		provider = new CondorPayCo(BASE_CONFIG);
	});

	it("has name = 'condorpay-co'", () => {
		expect(provider.name).toBe("condorpay-co");
	});

	describe("createPayment", () => {
		it("returns PaymentResponse with PENDING status and wompiUrl", async () => {
			vi.spyOn(provider.wompi, "createPaymentLink").mockResolvedValue(
				MOCK_LINK,
			);

			const response = await provider.createPayment({
				id: "pay-001",
				amount: { value: "50000", currency: Currency.COP },
				description: "Test payment",
				idempotencyKey: "idem-001",
			});

			expect(response.status).toBe(PaymentStatus.PENDING);
			expect(response.id).toBe("link-001");
			expect(response.metadata?.wompiUrl).toBe(
				"https://checkout.wompi.co/l/abc",
			);
		});

		it("throws ValidationError for non-COP currency", async () => {
			await expect(
				provider.createPayment({
					id: "pay-002",
					amount: { value: "100", currency: Currency.MXN },
					description: "Bad",
					idempotencyKey: "idem-002",
				}),
			).rejects.toBeInstanceOf(ValidationError);
		});
	});

	describe("getPayment", () => {
		it("maps ACTIVE to PENDING", async () => {
			vi.spyOn(provider.wompi, "getPaymentLink").mockResolvedValue({
				...MOCK_LINK,
				status: WompiPaymentLinkStatus.ACTIVE,
			});
			const resp = await provider.getPayment("link-001");
			expect(resp.status).toBe(PaymentStatus.PENDING);
		});

		it("maps INACTIVE to COMPLETED", async () => {
			vi.spyOn(provider.wompi, "getPaymentLink").mockResolvedValue({
				...MOCK_LINK,
				status: WompiPaymentLinkStatus.INACTIVE,
			});
			const resp = await provider.getPayment("link-001");
			expect(resp.status).toBe(PaymentStatus.COMPLETED);
		});

		it("maps EXPIRED to CANCELLED", async () => {
			vi.spyOn(provider.wompi, "getPaymentLink").mockResolvedValue({
				...MOCK_LINK,
				status: WompiPaymentLinkStatus.EXPIRED,
			});
			const resp = await provider.getPayment("link-001");
			expect(resp.status).toBe(PaymentStatus.CANCELLED);
		});
	});

	describe("cancelPayment", () => {
		it("throws CondorPayError with PAYMENT_ALREADY_CANCELLED for expired link", async () => {
			vi.spyOn(provider.wompi, "getPaymentLink").mockResolvedValue({
				...MOCK_LINK,
				status: WompiPaymentLinkStatus.EXPIRED,
			});
			const err = await provider.cancelPayment("link-001").catch((e) => e);
			expect(err).toBeInstanceOf(CondorPayError);
			expect((err as CondorPayError).code).toBe(
				ErrorCode.PAYMENT_ALREADY_CANCELLED,
			);
		});

		it("throws CondorPayError for active link (not supported)", async () => {
			vi.spyOn(provider.wompi, "getPaymentLink").mockResolvedValue({
				...MOCK_LINK,
				status: WompiPaymentLinkStatus.ACTIVE,
			});
			await expect(provider.cancelPayment("link-001")).rejects.toBeInstanceOf(
				CondorPayError,
			);
		});
	});

	describe("generateQr", () => {
		it("returns BrebQrResult with payload and svg", () => {
			const result = provider.generateQr({
				merchantName: "Test Merchant",
				merchantCity: "Medellin",
				merchantAccountId: "123456789",
			});
			expect(result.payload).toBeTruthy();
			expect(result.svg.startsWith("<svg")).toBe(true);
		});
	});
});
