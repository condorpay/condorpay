import type { Amount } from "@condorpay/core";
import { ValidationError } from "@condorpay/core";
import { sha256Hex } from "./sha256.js";

export interface CreateCheckoutUrlRequest {
	/**
	 * Merchant-controlled identifier. Wompi echoes it back verbatim as
	 * `transaction.reference` in every webhook for this payment, which is the
	 * only way to tie the callback back to the checkout that started it.
	 */
	reference: string;
	amount: Amount;
	/** Where Wompi sends the customer once the payment resolves. */
	redirectUrl?: string;
	/** ISO-8601. When present it becomes part of the signed string. */
	expirationTime?: string;
	customerEmail?: string;
	customerFullName?: string;
	customerPhoneNumber?: string;
}

export interface BuildCheckoutUrlOptions {
	checkoutUrl: string;
	publicKey: string;
	integritySecret: string;
	request: CreateCheckoutUrlRequest;
}

/**
 * Builds a signed Wompi Web Checkout URL.
 *
 * Web Checkout is used instead of the Payment Links API because a payment link
 * cannot carry a merchant reference: Wompi mints its own, so the webhook comes
 * back bearing an identifier the caller has never seen and cannot resolve.
 * Web Checkout takes the reference as an input, so it survives the round trip.
 */
export async function buildWompiCheckoutUrl(
	options: BuildCheckoutUrlOptions,
): Promise<string> {
	const { checkoutUrl, publicKey, integritySecret, request } = options;

	if (!integritySecret) {
		throw new ValidationError("integritySecret must not be empty", {
			integritySecret: "required",
		});
	}
	if (!request.reference) {
		throw new ValidationError("reference must not be empty", {
			reference: "required",
		});
	}

	const amountInCents = Math.round(parseFloat(request.amount.value) * 100);
	const currency = request.amount.currency;

	// Wompi's documented concatenation, in this exact order:
	//   <Reference><Amount><Currency>[<ExpirationDate>]<SecretIntegrity>
	const signature = await sha256Hex(
		`${request.reference}${amountInCents}${currency}${
			request.expirationTime ?? ""
		}${integritySecret}`,
	);

	const params: [string, string][] = [
		["public-key", publicKey],
		["currency", currency],
		["amount-in-cents", String(amountInCents)],
		["reference", request.reference],
		["signature:integrity", signature],
	];

	if (request.redirectUrl) params.push(["redirect-url", request.redirectUrl]);
	if (request.expirationTime) {
		params.push(["expiration-time", request.expirationTime]);
	}
	if (request.customerEmail) {
		params.push(["customer-data:email", request.customerEmail]);
	}
	if (request.customerFullName) {
		params.push(["customer-data:full-name", request.customerFullName]);
	}
	if (request.customerPhoneNumber) {
		params.push(["customer-data:phone-number", request.customerPhoneNumber]);
	}

	// Keys are written raw: `:` is legal in a query string (RFC 3986) and Wompi
	// documents the parameter as `signature:integrity`, not percent-encoded.
	const query = params
		.map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
		.join("&");

	return `${checkoutUrl}/p/?${query}`;
}
