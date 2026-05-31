import { ValidationError } from "@condorpay/core";
import { describe, expect, it } from "vitest";
import { WompiTransactionStatus } from "./types.js";
import { validateWompiWebhook } from "./webhook.js";

const EVENT_KEY = "test-event-key-12345";

const TRANSACTION = {
	id: "tx-001",
	status: WompiTransactionStatus.APPROVED,
	amount_in_cents: 5000000,
	currency: "COP" as const,
	payment_method_type: "CARD",
	reference: "ref-001",
	created_at: "2026-04-02T00:00:00Z",
};

const TIMESTAMP = 1743552000;

async function computeWompiChecksum(
	eventKey: string,
	values: readonly string[],
	timestamp: number,
): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(`${values.join("")}${timestamp}${eventKey}`);
	const digest = await globalThis.crypto.subtle.digest("SHA-256", data);
	return Array.from(new Uint8Array(digest))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

async function createValidEvent(): Promise<{
	event: string;
	data: { transaction: typeof TRANSACTION };
	environment: string;
	signature: { checksum: string; properties: string[] };
	timestamp: number;
}> {
	const checksum = await computeWompiChecksum(
		EVENT_KEY,
		[TRANSACTION.id, TRANSACTION.status, String(TRANSACTION.amount_in_cents)],
		TIMESTAMP,
	);
	return {
		event: "transaction.updated",
		data: { transaction: TRANSACTION },
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

describe("validateWompiWebhook", () => {
	it("returns true for a valid Wompi SHA-256 checksum", async () => {
		const event = await createValidEvent();
		const result = await validateWompiWebhook(
			event,
			event.signature.checksum,
			EVENT_KEY,
		);
		expect(result).toBe(true);
	});

	it("uses the event body checksum when a header checksum is not provided", async () => {
		const event = await createValidEvent();
		const result = await validateWompiWebhook(event, "", EVENT_KEY);
		expect(result).toBe(true);
	});

	it("returns true for a valid Wompi SHA-256 checksum using signature properties", async () => {
		const officialTransaction = {
			id: "1234-1610641025-49201",
			amount_in_cents: 4_490_000,
			reference: "MZQ3X2DE2SMX",
			customer_email: "juan.perez@gmail.com",
			currency: "COP",
			payment_method_type: "NEQUI",
			redirect_url: "https://mitienda.com.co/pagos/redireccion",
			status: WompiTransactionStatus.APPROVED,
			shipping_address: null,
			payment_link_id: null,
			payment_source_id: null,
		};
		const checksum = await computeWompiChecksum(
			EVENT_KEY,
			[
				officialTransaction.id,
				officialTransaction.status,
				String(officialTransaction.amount_in_cents),
			],
			TIMESTAMP,
		);
		const officialEvent = {
			event: "transaction.updated",
			data: { transaction: officialTransaction },
			environment: "prod",
			signature: {
				properties: [
					"transaction.id",
					"transaction.status",
					"transaction.amount_in_cents",
				],
				checksum,
			},
			timestamp: TIMESTAMP,
			sent_at: "2018-07-20T16:45:05.000Z",
		};

		const result = await validateWompiWebhook(
			officialEvent,
			checksum.toUpperCase(),
			EVENT_KEY,
		);

		expect(result).toBe(true);
	});

	it("returns false for an invalid signature", async () => {
		const event = await createValidEvent();
		const result = await validateWompiWebhook(
			event,
			"deadbeefdeadbeef",
			EVENT_KEY,
		);
		expect(result).toBe(false);
	});

	it("returns false for a tampered transaction ID", async () => {
		const event = await createValidEvent();
		const tamperedEvent = {
			...event,
			data: { transaction: { ...TRANSACTION, id: "tx-999" } },
		} as typeof event;
		const result = await validateWompiWebhook(
			tamperedEvent,
			event.signature.checksum,
			EVENT_KEY,
		);
		expect(result).toBe(false);
	});

	it("throws ValidationError when eventKey is empty", async () => {
		const event = await createValidEvent();
		await expect(
			validateWompiWebhook(event, event.signature.checksum, ""),
		).rejects.toBeInstanceOf(ValidationError);
	});

	it("returns false for a structurally malformed event (null transaction)", async () => {
		const event = await createValidEvent();
		const malformed = {
			...event,
			data: { transaction: null },
		} as unknown as typeof event;
		const result = await validateWompiWebhook(malformed, "anysig", EVENT_KEY);
		expect(result).toBe(false);
	});

	it("returns a Promise<boolean>", () => {
		const sig = "deadbeef";
		const result = validateWompiWebhook(
			{
				event: "transaction.updated",
				data: { transaction: TRANSACTION },
				environment: "prod",
				signature: {
					checksum: sig,
					properties: ["transaction.id"],
				},
				timestamp: TIMESTAMP,
			},
			sig,
			EVENT_KEY,
		);
		expect(result).toBeInstanceOf(Promise);
	});
});
