import type { Amount } from "@condorpay/core";
import { Currency } from "@condorpay/core";

export { Currency };

export interface WompiConfig {
	publicKey: string;
	privateKey: string;
	baseUrl?: string;
	/**
	 * Host that serves the hosted checkout pages. Wompi does not return a link
	 * URL, so it is built as `${checkoutUrl}/l/${id}`. Defaults to production;
	 * set it explicitly when pointing baseUrl at the sandbox.
	 */
	checkoutUrl?: string;
	/**
	 * "Secreto de integridad" (prod_integrity_*) from the Wompi dashboard, used
	 * to sign Web Checkout URLs. This is NOT the events secret (prod_events_*)
	 * that validates incoming webhooks - Wompi issues two distinct values.
	 */
	integritySecret?: string;
}

export enum WompiPaymentLinkStatus {
	ACTIVE = "ACTIVE",
	INACTIVE = "INACTIVE",
	EXPIRED = "EXPIRED",
}

export interface CreatePaymentLinkRequest {
	name: string;
	description?: string;
	amount: Amount;
	expiresAt?: string;
	singleUse?: boolean;
	collectShipping?: boolean;
	redirectUrl?: string;
}

/**
 * What Wompi actually returns from /payment_links, in its own snake_case shape.
 *
 * It is deliberately separate from WompiPaymentLink: the previous code typed
 * the raw response AS the domain object, so every camelCase read silently
 * produced undefined. Note there is no `url` field at all - the checkout URL
 * is derived from the id.
 */
export interface WompiPaymentLinkResponse {
	id: string;
	name: string;
	description?: string | null;
	amount_in_cents: number;
	currency: string;
	single_use: boolean;
	collect_shipping: boolean;
	active: boolean;
	expires_at?: string | null;
	redirect_url?: string | null;
	created_at: string;
	updated_at?: string | null;
}

export interface WompiPaymentLink {
	id: string;
	name: string;
	url: string;
	amount: Amount;
	currency: Currency;
	status: WompiPaymentLinkStatus;
	createdAt: string;
	expiresAt?: string;
}

export enum BankAccountType {
	SAVINGS_ACCOUNT = "SAVINGS_ACCOUNT",
	CHECKING_ACCOUNT = "CHECKING_ACCOUNT",
}

export enum IdType {
	CC = "CC",
	CE = "CE",
	NIT = "NIT",
	PP = "PP",
}

export interface BankAccountInfo {
	bankCode: string;
	accountNumber: string;
	accountType: BankAccountType;
	holderName: string;
	holderIdType: IdType;
	holderId: string;
}

export interface CreatePayoutRequest {
	amount: Amount;
	reference: string;
	destinationBankAccount: BankAccountInfo;
	description?: string;
}

export enum WompiPayoutStatus {
	PENDING = "PENDING",
	PROCESSING = "PROCESSING",
	COMPLETED = "COMPLETED",
	FAILED = "FAILED",
	REVERSED = "REVERSED",
}

export interface WompiPayout {
	id: string;
	status: WompiPayoutStatus;
	amount: Amount;
	currency: Currency;
	reference: string;
	createdAt: string;
	completedAt?: string;
	errorMessage?: string;
}

export enum WompiTransactionStatus {
	PENDING = "PENDING",
	APPROVED = "APPROVED",
	DECLINED = "DECLINED",
	VOIDED = "VOIDED",
	ERROR = "ERROR",
}

export interface WompiTransaction {
	id: string;
	status: WompiTransactionStatus;
	amountInCents: number;
	currency: Currency;
	paymentMethodType: string;
	reference: string;
	createdAt: string;
}

export interface WompiWebhookEvent {
	event: string;
	data: {
		transaction: WompiTransaction;
	};
	environment: string;
	signature: {
		checksum: string;
		properties: string[];
	};
	timestamp: number;
}

/**
 * A transaction exactly as `/transactions` returns it, in Wompi's snake_case.
 * Kept separate from {@link WompiTransaction} so no camelCase read can silently
 * resolve to undefined.
 */
export interface WompiTransactionResponse {
	id: string;
	status: string;
	amount_in_cents: number;
	currency: string;
	payment_method_type?: string | null;
	reference: string;
	created_at: string;
}
