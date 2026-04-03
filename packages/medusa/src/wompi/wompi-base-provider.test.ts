import { WompiClient, WompiPaymentLinkStatus } from "@condorpay/co";
import { Currency } from "@condorpay/core";
import type { InitiatePaymentInput } from "@medusajs/types";
import { BigNumber } from "@medusajs/utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CondorPayWompiCardProvider } from "./wompi-card-provider.js";

const wompiOptions = {
	wompi: {
		publicKey: "pub_test",
		privateKey: "prv_test",
		eventsIntegrityKey: "integrity_test",
	},
};

function cardProvider(): CondorPayWompiCardProvider {
	return new CondorPayWompiCardProvider({}, wompiOptions);
}

const mockLink = {
	id: "plink_001",
	name: "Test",
	url: "https://sandbox.wompi.co/checkout/plink_001",
	amount: { value: "50000", currency: Currency.COP },
	currency: Currency.COP,
	status: WompiPaymentLinkStatus.ACTIVE,
	createdAt: "2026-04-02T00:00:00Z",
};

describe("CondorPayWompiBaseProvider", () => {
	let createSpy: ReturnType<typeof vi.spyOn>;
	let getSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		createSpy = vi
			.spyOn(WompiClient.prototype, "createPaymentLink")
			.mockResolvedValue(mockLink);
		getSpy = vi
			.spyOn(WompiClient.prototype, "getPaymentLink")
			.mockResolvedValue({
				...mockLink,
				status: WompiPaymentLinkStatus.ACTIVE,
			});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("initiatePayment calls createPaymentLink and returns wompi data", async () => {
		const p = cardProvider();
		const input: InitiatePaymentInput = {
			amount: new BigNumber(50_000),
			currency_code: "cop",
			data: {},
		};
		const out = await p.initiatePayment(input);
		expect(createSpy).toHaveBeenCalledOnce();
		expect(out.id).toBe("plink_001");
		expect(out.data?.wompiId).toBe("plink_001");
		expect(out.data?.wompiUrl).toContain("plink_001");
	});

	it("throws when currency is not COP", async () => {
		const p = cardProvider();
		const input: InitiatePaymentInput = {
			amount: new BigNumber(10),
			currency_code: "usd",
			data: {},
		};
		await expect(p.initiatePayment(input)).rejects.toThrow(/Only COP/);
	});

	it("capturePayment returns input data", async () => {
		const p = cardProvider();
		const data = { wompiId: "x" };
		const out = await p.capturePayment({ data });
		expect(out.data).toEqual(data);
	});

	it("authorizePayment returns pending", async () => {
		const p = cardProvider();
		const out = await p.authorizePayment({ data: { a: 1 } });
		expect(out.status).toBe("pending");
	});

	it("getPaymentStatus maps ACTIVE to pending", async () => {
		const p = cardProvider();
		getSpy.mockResolvedValueOnce({
			...mockLink,
			status: WompiPaymentLinkStatus.ACTIVE,
		});
		const out = await p.getPaymentStatus({
			data: { wompiId: "plink_001" },
		});
		expect(out.status).toBe("pending");
		expect(getSpy).toHaveBeenCalledWith("plink_001");
	});

	it("getPaymentStatus maps INACTIVE to authorized", async () => {
		const p = cardProvider();
		getSpy.mockResolvedValueOnce({
			...mockLink,
			status: WompiPaymentLinkStatus.INACTIVE,
		});
		const out = await p.getPaymentStatus({
			data: { wompiId: "plink_001" },
		});
		expect(out.status).toBe("authorized");
	});

	it("getPaymentStatus maps EXPIRED to canceled", async () => {
		const p = cardProvider();
		getSpy.mockResolvedValueOnce({
			...mockLink,
			status: WompiPaymentLinkStatus.EXPIRED,
		});
		const out = await p.getPaymentStatus({
			data: { wompiId: "plink_001" },
		});
		expect(out.status).toBe("canceled");
	});
});
