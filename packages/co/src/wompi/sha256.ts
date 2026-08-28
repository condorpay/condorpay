/**
 * Hex-encoded SHA-256, shared by the webhook validator and the checkout
 * signer. Both hash a concatenated string with the same algorithm, and Wompi
 * rejects a payment silently if the two ever drift apart.
 */
export async function sha256Hex(value: string): Promise<string> {
	const encoder = new TextEncoder();
	const digest = await globalThis.crypto.subtle.digest(
		"SHA-256",
		encoder.encode(value),
	);
	return Array.from(new Uint8Array(digest))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}
