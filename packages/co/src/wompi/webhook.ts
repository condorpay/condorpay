import { ValidationError } from "@condorpay/core";
import type { WompiWebhookEvent } from "./types.js";

export async function validateWompiWebhook(
	event: WompiWebhookEvent,
	signature: string,
	eventKey: string,
): Promise<boolean> {
	if (!eventKey) {
		throw new ValidationError("eventKey must not be empty", {
			eventKey: "required",
		});
	}

	try {
		const tx = event?.data?.transaction;
		if (!tx || typeof tx.id !== "string") return false;

		const checksumString =
			tx.id +
			tx.status +
			String(tx.amountInCents) +
			tx.currency +
			tx.paymentMethodType +
			String(event.timestamp);

		const encoder = new TextEncoder();
		const keyData = encoder.encode(eventKey);
		const msgData = encoder.encode(checksumString);

		const key = await globalThis.crypto.subtle.importKey(
			"raw",
			keyData,
			{ name: "HMAC", hash: "SHA-256" },
			false,
			["sign"],
		);

		const sig = await globalThis.crypto.subtle.sign("HMAC", key, msgData);
		const computed = Array.from(new Uint8Array(sig))
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("");

		return computed === signature.toLowerCase();
	} catch {
		return false;
	}
}
