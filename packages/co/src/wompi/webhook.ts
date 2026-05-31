import { ValidationError } from "@condorpay/core";
import type { WompiWebhookEvent } from "./types.js";

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object";
}

function readPath(source: unknown, path: string): unknown {
	if (!isRecord(source)) {
		return undefined;
	}
	let current: unknown = source;
	for (const segment of path.split(".")) {
		if (!isRecord(current)) {
			return undefined;
		}
		current = current[segment];
	}
	return current;
}

function toChecksumValue(value: unknown): string | undefined {
	if (
		typeof value === "string" ||
		typeof value === "number" ||
		typeof value === "boolean"
	) {
		return String(value);
	}
	return undefined;
}

function constantTimeEqualHex(left: string, right: string): boolean {
	const a = left.toLowerCase();
	const b = right.toLowerCase();
	if (a.length !== b.length) {
		return false;
	}
	let diff = 0;
	for (let i = 0; i < a.length; i++) {
		diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	return diff === 0;
}

async function sha256Hex(value: string): Promise<string> {
	const encoder = new TextEncoder();
	const digest = await globalThis.crypto.subtle.digest(
		"SHA-256",
		encoder.encode(value),
	);
	return Array.from(new Uint8Array(digest))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

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
		if (!isRecord(event) || !isRecord(event.signature)) {
			return false;
		}
		if (!Array.isArray(event.signature.properties)) {
			return false;
		}
		if (typeof event.timestamp !== "number") {
			return false;
		}

		const values: string[] = [];
		for (const property of event.signature.properties) {
			if (typeof property !== "string") {
				return false;
			}
			const value = toChecksumValue(readPath(event.data, property));
			if (value === undefined) {
				return false;
			}
			values.push(value);
		}

		const checksum = signature !== "" ? signature : event.signature.checksum;
		if (typeof checksum !== "string" || checksum === "") {
			return false;
		}

		const computed = await sha256Hex(
			`${values.join("")}${event.timestamp}${eventKey}`,
		);
		return constantTimeEqualHex(computed, checksum);
	} catch {
		return false;
	}
}
