import { CondorPayCo, WompiPaymentLinkStatus } from "@condorpay/co";
import {
	CondorPayError,
	Currency,
	PaymentStatus,
	ValidationError,
} from "@condorpay/core";
import { describe, expect, it } from "vitest";
import { CondorPay } from "./client.js";

const BASE_CONFIG = {
	country: "co" as const,
	wompi: { publicKey: "pub_test", privateKey: "priv_test" },
};

describe("CondorPay", () => {
	describe("instantiation", () => {
		it("creates an instance with country: co", () => {
			const cp = new CondorPay(BASE_CONFIG);
			expect(cp).toBeInstanceOf(CondorPay);
		});

		it("cp.co is a CondorPayCo instance", () => {
			const cp = new CondorPay(BASE_CONFIG);
			expect(cp.co).toBeInstanceOf(CondorPayCo);
		});
	});

	describe("cp.co", () => {
		it("generateQr returns BrebQrResult with payload and svg", () => {
			const cp = new CondorPay(BASE_CONFIG);
			const result = cp.co.generateQr({
				merchantName: "Test Merchant",
				merchantCity: "Medellin",
				merchantAccountId: "123456789",
			});
			expect(result.payload).toBeTruthy();
			expect(result.svg.startsWith("<svg")).toBe(true);
		});

		it("co.name is condorpay-co", () => {
			const cp = new CondorPay(BASE_CONFIG);
			expect(cp.co.name).toBe("condorpay-co");
		});
	});

	describe("re-exports from @condorpay/core", () => {
		it("Currency is exported", () => {
			expect(Currency.COP).toBe("COP");
		});

		it("PaymentStatus is exported", () => {
			expect(PaymentStatus.PENDING).toBeDefined();
		});

		it("CondorPayError is exported and instanceof works", () => {
			const err = new CondorPayError("test", "UNKNOWN_ERROR" as never);
			expect(err).toBeInstanceOf(CondorPayError);
			expect(err).toBeInstanceOf(Error);
		});

		it("ValidationError is exported", () => {
			const err = new ValidationError("bad", { field: "required" });
			expect(err).toBeInstanceOf(ValidationError);
		});
	});

	describe("@condorpay/sdk/co re-exports", () => {
		it("CondorPayCo is accessible from @condorpay/co", () => {
			expect(CondorPayCo).toBeDefined();
		});

		it("WompiPaymentLinkStatus is accessible from @condorpay/co", () => {
			expect(WompiPaymentLinkStatus.ACTIVE).toBeDefined();
		});
	});
});
