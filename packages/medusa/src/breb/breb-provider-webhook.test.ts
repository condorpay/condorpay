import { WompiTransactionStatus } from "@condorpay/co";
import type { RefundPaymentInput } from "@medusajs/types";
import { BigNumber } from "@medusajs/utils";
import { describe, expect, it } from "vitest";
import { CondorPayBrebProvider } from "./breb-provider.js";

const EVENT_KEY = "test-event-key-12345";

const TRANSACTION = {
	id: "tx-001",
	status: WompiTransactionStatus.APPROVED,
	amountInCents: 5_000_000,
	currency: "COP" as const,
	paymentMethodType: "CARD",
	reference: "payses_ref_001",
	createdAt: "2026-04-02T00:00:00Z",
};

const TIMESTAMP = 1743552000;

async function computeSignature(
	eventKey: string,
	tx: typeof TRANSACTION,
	timestamp: number,
): Promise<string> {
	const checksumString =
		tx.id +
		tx.status +
		String(tx.amountInCents) +
		tx.currency +
		tx.paymentMethodType +
		String(timestamp);
	const encoder = new TextEncoder();
	const key = await globalThis.crypto.subtle.importKey(
		"raw",
		encoder.encode(eventKey),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const sig = await globalThis.crypto.subtle.sign(
		"HMAC",
		key,
		encoder.encode(checksumString),
	);
	return Array.from(new Uint8Array(sig))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

function provider(): CondorPayBrebProvider {
	return new CondorPayBrebProvider(
		{},
		{
			wompi: {
				publicKey: "pub",
				privateKey: "prv",
				eventsIntegrityKey: EVENT_KEY,
			},
			breb: {
				merchantAccountId: "000123456789",
				merchantName: "M",
				merchantCity: "BOG",
			},
		},
	);
}

describe("CondorPayBrebProvider webhooks", () => {
	it("returns authorized action for a valid approved event", async () => {
		const p = provider();
		const signature = await computeSignature(EVENT_KEY, TRANSACTION, TIMESTAMP);
		const body = {
			event: "transaction.updated",
			data: { transaction: TRANSACTION },
			environment: "production",
			signature: { checksum: "", properties: [] },
			timestamp: TIMESTAMP,
		};
		const result = await p.getWebhookActionAndData({
			data: body as unknown as Record<string, unknown>,
			rawData: JSON.stringify(body),
			headers: { "x-signature": signature },
		});
		expect(result.action).toBe("authorized");
		expect(result.data?.session_id).toBe("payses_ref_001");
		expect(new BigNumber(result.data?.amount ?? 0).numeric).toBe(50_000);
	});

	it("returns failed action for a declined transaction", async () => {
		const p = provider();
		const declined = {
			...TRANSACTION,
			status: WompiTransactionStatus.DECLINED,
		};
		const signature = await computeSignature(EVENT_KEY, declined, TIMESTAMP);
		const body = {
			event: "transaction.updated",
			data: { transaction: declined },
			environment: "production",
			signature: { checksum: "", properties: [] },
			timestamp: TIMESTAMP,
		};
		const result = await p.getWebhookActionAndData({
			data: body as unknown as Record<string, unknown>,
			rawData: JSON.stringify(body),
			headers: { "x-signature": signature },
		});
		expect(result.action).toBe("failed");
	});

	it("returns not_supported when HMAC is invalid", async () => {
		const p = provider();
		const body = {
			event: "transaction.updated",
			data: { transaction: TRANSACTION },
			environment: "production",
			signature: { checksum: "", properties: [] },
			timestamp: TIMESTAMP,
		};
		const result = await p.getWebhookActionAndData({
			data: body as unknown as Record<string, unknown>,
			rawData: JSON.stringify(body),
			headers: { "x-signature": "deadbeef" },
		});
		expect(result.action).toBe("not_supported");
	});

	it("throws NOT_ALLOWED on refundPayment", async () => {
		const p = provider();
		const input: RefundPaymentInput = {
			amount: new BigNumber(1),
			data: {},
		};
		await expect(p.refundPayment(input)).rejects.toThrow(
			/Refunds are not supported/,
		);
	});
});
