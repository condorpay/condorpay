import type { Amount } from "@condorpay/core";

export interface BrebQrOptions {
	merchantName: string;
	merchantCity: string;
	merchantAccountId: string;
	merchantCategoryCode?: string;
	transactionAmount?: Amount;
	additionalData?: {
		referenceLabel?: string;
	};
}

export interface BrebQrResult {
	payload: string;
	svg: string;
}
