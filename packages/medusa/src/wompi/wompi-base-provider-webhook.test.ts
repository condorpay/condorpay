import { WompiTransactionStatus } from "@condorpay/co";
import type { RefundPaymentInput } from "@medusajs/types";
import { BigNumber } from "@medusajs/utils";
import { describe, expect, it } from "vitest";
import { CondorPayWompiCardProvider } from "./wompi-card-provider.js";

const EVENT_KEY = "test-event-key-wompi";

const TRANSACTION = {
	id: "tx-002",
	status: WompiTransactionStatus.APPROVED,
	amount_in_cents: 1_000_000,
	currency: "COP" as const,
	payment_method_type: "NEQUI",
	reference: "payses_wompi_002",
	created_at: "2026-04-02T00:00:00Z",
};

const TIMESTAMP = 1743552000;

async function computeWompiChecksum(
	eventKey: string,
	tx: typeof TRANSACTION,
	timestamp: number,
): Promise<string> {
	const checksumString =
		tx.id +
		tx.status +
		String(tx.amount_in_cents) +
		String(timestamp) +
		eventKey;
	const encoder = new TextEncoder();
	const digest = await globalThis.crypto.subtle.digest(
		"SHA-256",
		encoder.encode(checksumString),
	);
	return Array.from(new Uint8Array(digest))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

async function createWompiBody(tx: typeof TRANSACTION): Promise<{
	event: string;
	data: { transaction: typeof TRANSACTION };
	environment: string;
	signature: { checksum: string; properties: string[] };
	timestamp: number;
}> {
	const checksum = await computeWompiChecksum(EVENT_KEY, tx, TIMESTAMP);
	return {
		event: "transaction.updated",
		data: { transaction: tx },
		environment: "prod",
		signature: {
			checksum,
			properties: [
				"transaction.id",
				"transaction.status",
				"transaction.amount_in_cents",
			],
		},
		timestamp: TIMESTAMP,
	};
}

function provider(): CondorPayWompiCardProvider {
	return new CondorPayWompiCardProvider(
		{},
		{
			wompi: {
				publicKey: "pub",
				privateKey: "prv",
				eventsIntegrityKey: EVENT_KEY,
			},
		},
	);
}

describe("CondorPayWompiBaseProvider webhooks", () => {
	it("returns authorized with session_id and amount for approved event", async () => {
		const p = provider();
		const body = await createWompiBody(TRANSACTION);
		const result = await p.getWebhookActionAndData({
			data: body as unknown as Record<string, unknown>,
			rawData: JSON.stringify(body),
			headers: { "x-event-checksum": body.signature.checksum },
		});
		expect(result.action).toBe("authorized");
		expect(result.data?.session_id).toBe("payses_wompi_002");
		expect(new BigNumber(result.data?.amount ?? 0).numeric).toBe(10_000);
	});

	it("returns failed for declined transaction", async () => {
		const p = provider();
		const declined = {
			...TRANSACTION,
			status: WompiTransactionStatus.DECLINED,
		};
		const body = await createWompiBody(declined);
		const result = await p.getWebhookActionAndData({
			data: body as unknown as Record<string, unknown>,
			rawData: JSON.stringify(body),
			headers: { "x-event-checksum": body.signature.checksum },
		});
		expect(result.action).toBe("failed");
	});

	it("returns not_supported for bad signature", async () => {
		const p = provider();
		const body = await createWompiBody(TRANSACTION);
		const result = await p.getWebhookActionAndData({
			data: body as unknown as Record<string, unknown>,
			rawData: JSON.stringify(body),
			headers: { "x-event-checksum": "bad" },
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
