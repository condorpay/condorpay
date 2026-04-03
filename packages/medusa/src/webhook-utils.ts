import type { WompiWebhookEvent } from "@condorpay/co";
import { validateWompiWebhook } from "@condorpay/co";
import type {
	PaymentActions,
	ProviderWebhookPayload,
	WebhookActionResult,
} from "@medusajs/types";
import { BigNumber } from "@medusajs/utils";

/**
 * Maps a validated Wompi transaction status to a Medusa {@link PaymentActions} value.
 *
 * @param event - Parsed Wompi webhook payload
 * @returns Medusa payment action string
 */
export function mapWompiEventToMedusaAction(
	event: WompiWebhookEvent,
): PaymentActions {
	const status = event.data.transaction.status;
	switch (status) {
		case "APPROVED":
			return "authorized";
		case "DECLINED":
		case "VOIDED":
		case "ERROR":
			return "failed";
		case "PENDING":
			return "pending";
		default:
			return "not_supported";
	}
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object";
}

function isWompiWebhookEvent(
	candidate: unknown,
): candidate is WompiWebhookEvent {
	if (!isRecord(candidate)) {
		return false;
	}
	if (typeof candidate.event !== "string") {
		return false;
	}
	if (!isRecord(candidate.data)) {
		return false;
	}
	if (!isRecord(candidate.data.transaction)) {
		return false;
	}
	const tx = candidate.data.transaction;
	return (
		typeof tx.id === "string" &&
		typeof tx.status === "string" &&
		typeof tx.amountInCents === "number" &&
		typeof tx.currency === "string" &&
		typeof tx.paymentMethodType === "string" &&
		typeof tx.reference === "string" &&
		typeof candidate.timestamp === "number"
	);
}

/**
 * Parses a Wompi JSON webhook from Medusa's {@link ProviderWebhookPayload} shape.
 *
 * @param payload - Inner webhook payload (`data`, `rawData`, `headers`)
 * @returns Parsed event or `null` if the body is not a Wompi transaction event
 */
export function parseWompiWebhookFromMedusaPayload(
	payload: ProviderWebhookPayload["payload"],
): WompiWebhookEvent | null {
	let parsed: unknown;
	if (typeof payload.rawData === "string") {
		try {
			parsed = JSON.parse(payload.rawData);
		} catch {
			parsed = undefined;
		}
	} else if (
		typeof Buffer !== "undefined" &&
		Buffer.isBuffer(payload.rawData)
	) {
		try {
			parsed = JSON.parse(payload.rawData.toString("utf8"));
		} catch {
			parsed = undefined;
		}
	}
	if (parsed !== undefined && isWompiWebhookEvent(parsed)) {
		return parsed;
	}
	if (isWompiWebhookEvent(payload.data)) {
		return payload.data;
	}
	return null;
}

/**
 * Reads the Wompi HMAC hex digest from common webhook header names.
 *
 * @param headers - HTTP headers from the webhook request
 * @returns Signature string or empty when missing
 */
export function extractWompiSignatureFromHeaders(
	headers: Record<string, unknown>,
): string {
	for (const [key, value] of Object.entries(headers)) {
		if (key.toLowerCase() === "x-signature" && typeof value === "string") {
			return value;
		}
	}
	return "";
}

/**
 * Validates the Wompi HMAC and returns a Medusa {@link WebhookActionResult}.
 *
 * @param event - Parsed Wompi event
 * @param signature - HMAC hex digest from the `X-Signature` header
 * @param eventsIntegrityKey - Wompi Events integrity secret
 */
export async function wompiWebhookToMedusaResult(
	event: WompiWebhookEvent,
	signature: string,
	eventsIntegrityKey: string,
): Promise<WebhookActionResult> {
	const valid = await validateWompiWebhook(
		event,
		signature,
		eventsIntegrityKey,
	);
	if (!valid) {
		return {
			action: "not_supported",
			data: {
				session_id: "",
				amount: new BigNumber(0),
			},
		};
	}

	const action = mapWompiEventToMedusaAction(event);
	const reference = event.data.transaction.reference;
	const amountMajor = new BigNumber(event.data.transaction.amountInCents / 100);

	if (action === "authorized") {
		return {
			action: "authorized",
			data: {
				session_id: reference,
				amount: amountMajor,
			},
		};
	}
	if (action === "failed") {
		return {
			action: "failed",
			data: {
				session_id: reference,
				amount: amountMajor,
			},
		};
	}
	if (action === "pending") {
		return {
			action: "pending",
			data: {
				session_id: reference,
				amount: amountMajor,
			},
		};
	}
	return {
		action: "not_supported",
		data: {
			session_id: reference,
			amount: amountMajor,
		},
	};
}
