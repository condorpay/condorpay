import type { Amount } from "@condorpay/core";
import { Currency } from "@condorpay/core";

export { Currency };

export interface WompiConfig {
	publicKey: string;
	privateKey: string;
	baseUrl?: string;
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
