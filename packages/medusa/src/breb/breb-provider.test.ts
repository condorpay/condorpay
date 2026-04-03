import type { InitiatePaymentInput } from "@medusajs/types";
import { BigNumber } from "@medusajs/utils";
import { describe, expect, it } from "vitest";
import { CondorPayBrebProvider } from "./breb-provider.js";

const baseOptions = {
	wompi: {
		publicKey: "pub_test",
		privateKey: "prv_test",
		eventsIntegrityKey: "integrity_test",
	},
	breb: {
		merchantAccountId: "000123456789",
		merchantName: "Test Merchant",
		merchantCity: "Bogotá",
	},
};

function provider(): CondorPayBrebProvider {
	return new CondorPayBrebProvider({}, baseOptions);
}

describe("CondorPayBrebProvider", () => {
	it("returns QR payload and svg in initiatePayment data", async () => {
		const p = provider();
		const input: InitiatePaymentInput = {
			amount: new BigNumber(50_000),
			currency_code: "cop",
			data: {},
		};
		const out = await p.initiatePayment(input);
		expect(out.id).toMatch(/^breb:[0-9a-f-]{36}$/);
		expect(out.status).toBe("pending");
		expect(typeof out.data?.payload).toBe("string");
		expect(out.data?.payload).toMatch(/^000201/);
		expect(typeof out.data?.svg).toBe("string");
		expect(String(out.data?.svg)).toMatch(/^<svg/);
	});

	it("throws when breb configuration is missing", async () => {
		const p = new CondorPayBrebProvider(
			{},
			{
				wompi: baseOptions.wompi,
			},
		);
		const input: InitiatePaymentInput = {
			amount: new BigNumber(1000),
			currency_code: "cop",
			data: {},
		};
		await expect(p.initiatePayment(input)).rejects.toThrow(
			/breb merchant configuration/,
		);
	});

	it("authorizePayment returns pending status", async () => {
		const p = provider();
		const out = await p.authorizePayment({
			data: { foo: "bar" },
		});
		expect(out.status).toBe("pending");
		expect(out.data).toEqual({ foo: "bar" });
	});

	it("capturePayment returns input data unchanged", async () => {
		const p = provider();
		const data = { k: 1 };
		const out = await p.capturePayment({ data });
		expect(out.data).toEqual(data);
	});
});
