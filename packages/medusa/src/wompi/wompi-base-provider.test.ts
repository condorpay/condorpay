import { WompiClient, WompiTransactionStatus } from "@condorpay/co";
import { Currency } from "@condorpay/core";
import type { InitiatePaymentInput } from "@medusajs/types";
import { BigNumber } from "@medusajs/utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CondorPayWompiCardProvider } from "./wompi-card-provider.js";

const wompiOptions = {
	wompi: {
		publicKey: "pub_test",
		privateKey: "prv_test",
		eventsIntegrityKey: "prod_events_test",
		integritySecret: "prod_integrity_test",
		redirectUrl: "https://carpintec.com/checkout/confirmacion",
	},
};

function cardProvider(): CondorPayWompiCardProvider {
	return new CondorPayWompiCardProvider({}, wompiOptions);
}

const SESSION_ID = "payses_01ABC";

const mockTransaction = {
	id: "txn_001",
	status: WompiTransactionStatus.APPROVED,
	amountInCents: 200_000,
	currency: Currency.COP,
	paymentMethodType: "NEQUI",
	reference: SESSION_ID,
	createdAt: "2026-08-28T00:00:00Z",
};

function initiateInput(
	overrides: Partial<InitiatePaymentInput> = {},
): InitiatePaymentInput {
	return {
		amount: new BigNumber(2000),
		currency_code: "cop",
		data: { session_id: SESSION_ID },
		...overrides,
	} as InitiatePaymentInput;
}

describe("CondorPayWompiBaseProvider", () => {
	let txSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		txSpy = vi
			.spyOn(WompiClient.prototype, "getTransactionByReference")
			.mockResolvedValue(mockTransaction);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("sends Medusa's payment session id as the Wompi reference", async () => {
		const out = await cardProvider().initiatePayment(initiateInput());

		expect(out.id).toBe(SESSION_ID);
		expect(out.data?.wompiReference).toBe(SESSION_ID);

		const url = new URL(String(out.data?.wompiUrl));
		// The reference is what the webhook echoes back. If it is anything other
		// than the session id, the callback cannot be matched and the shopper is
		// charged for an order Medusa never creates.
		expect(url.searchParams.get("reference")).toBe(SESSION_ID);
		expect(url.searchParams.get("amount-in-cents")).toBe("200000");
		expect(url.searchParams.get("signature:integrity")).toMatch(
			/^[0-9a-f]{64}$/,
		);
	});

	it("gives the shopper a way back to the store", async () => {
		const out = await cardProvider().initiatePayment(initiateInput());
		expect(
			new URL(String(out.data?.wompiUrl)).searchParams.get("redirect-url"),
		).toBe("https://carpintec.com/checkout/confirmacion");
	});

	it("falls back to the idempotency key when data carries no session id", async () => {
		const out = await cardProvider().initiatePayment(
			initiateInput({
				data: {},
				context: { idempotency_key: SESSION_ID },
			} as Partial<InitiatePaymentInput>),
		);
		expect(out.id).toBe(SESSION_ID);
	});

	it("refuses to start a payment it could never reconcile", async () => {
		await expect(
			cardProvider().initiatePayment(initiateInput({ data: {} })),
		).rejects.toThrow(/payment session id/);
	});

	it("throws when currency is not COP", async () => {
		await expect(
			cardProvider().initiatePayment(
				initiateInput({ amount: new BigNumber(10), currency_code: "usd" }),
			),
		).rejects.toThrow(/Only COP/);
	});

	it("authorizePayment resolves an approved transaction", async () => {
		const out = await cardProvider().authorizePayment({
			data: { wompiReference: SESSION_ID },
		});
		expect(txSpy).toHaveBeenCalledWith(SESSION_ID);
		expect(out.status).toBe("authorized");
		expect(out.data?.wompiTransactionId).toBe("txn_001");
	});

	it("authorizePayment reports a declined transaction as an error", async () => {
		txSpy.mockResolvedValueOnce({
			...mockTransaction,
			status: WompiTransactionStatus.DECLINED,
		});
		const out = await cardProvider().authorizePayment({
			data: { wompiReference: SESSION_ID },
		});
		expect(out.status).toBe("error");
	});

	it("authorizePayment stays pending while Wompi has no transaction yet", async () => {
		txSpy.mockResolvedValueOnce(null);
		const out = await cardProvider().authorizePayment({
			data: { wompiReference: SESSION_ID },
		});
		expect(out.status).toBe("pending");
	});

	it("authorizePayment stays pending when there is no reference to look up", async () => {
		const out = await cardProvider().authorizePayment({ data: {} });
		expect(txSpy).not.toHaveBeenCalled();
		expect(out.status).toBe("pending");
	});

	it("getPaymentStatus resolves by reference", async () => {
		txSpy.mockResolvedValueOnce({
			...mockTransaction,
			status: WompiTransactionStatus.PENDING,
		});
		const out = await cardProvider().getPaymentStatus({
			data: { wompiReference: SESSION_ID },
		});
		expect(txSpy).toHaveBeenCalledWith(SESSION_ID);
		expect(out.status).toBe("pending");
	});

	it("capturePayment returns input data", async () => {
		const data = { wompiReference: SESSION_ID };
		const out = await cardProvider().capturePayment({ data });
		expect(out.data).toEqual(data);
	});
});
