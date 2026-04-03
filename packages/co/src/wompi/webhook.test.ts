import { ValidationError } from "@condorpay/core";
import { describe, expect, it } from "vitest";
import { WompiTransactionStatus } from "./types.js";
import { validateWompiWebhook } from "./webhook.js";

const EVENT_KEY = "test-event-key-12345";

const TRANSACTION = {
	id: "tx-001",
	status: WompiTransactionStatus.APPROVED,
	amountInCents: 5000000,
	currency: "COP" as const,
	paymentMethodType: "CARD",
	reference: "ref-001",
	createdAt: "2026-04-02T00:00:00Z",
};

const TIMESTAMP = 1743552000;

const VALID_EVENT = {
	event: "transaction.updated",
	data: { transaction: TRANSACTION },
	environment: "production",
	signature: { checksum: "", properties: [] },
	timestamp: TIMESTAMP,
};

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

describe("validateWompiWebhook", () => {
	it("returns true for a valid HMAC signature", async () => {
		const signature = await computeSignature(EVENT_KEY, TRANSACTION, TIMESTAMP);
		const result = await validateWompiWebhook(
			VALID_EVENT,
			signature,
			EVENT_KEY,
		);
		expect(result).toBe(true);
	});

	it("returns false for an invalid signature", async () => {
		const result = await validateWompiWebhook(
			VALID_EVENT,
			"deadbeefdeadbeef",
			EVENT_KEY,
		);
		expect(result).toBe(false);
	});

	it("returns false for a tampered transaction ID", async () => {
		const signature = await computeSignature(EVENT_KEY, TRANSACTION, TIMESTAMP);
		const tamperedEvent = {
			...VALID_EVENT,
			data: { transaction: { ...TRANSACTION, id: "tx-999" } },
		};
		const result = await validateWompiWebhook(
			tamperedEvent,
			signature,
			EVENT_KEY,
		);
		expect(result).toBe(false);
	});

	it("throws ValidationError when eventKey is empty", async () => {
		const signature = await computeSignature(EVENT_KEY, TRANSACTION, TIMESTAMP);
		await expect(
			validateWompiWebhook(VALID_EVENT, signature, ""),
		).rejects.toBeInstanceOf(ValidationError);
	});

	it("returns false for a structurally malformed event (null transaction)", async () => {
		const malformed = {
			...VALID_EVENT,
			data: { transaction: null },
		} as unknown as typeof VALID_EVENT;
		const result = await validateWompiWebhook(malformed, "anysig", EVENT_KEY);
		expect(result).toBe(false);
	});

	it("returns a Promise<boolean>", () => {
		const sig = "deadbeef";
		const result = validateWompiWebhook(VALID_EVENT, sig, EVENT_KEY);
		expect(result).toBeInstanceOf(Promise);
	});
});
