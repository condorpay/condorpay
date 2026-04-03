import type { BrebMerchantConfig, WompiConfig } from "@condorpay/co";

/**
 * Wompi API credentials plus the Events integrity key used to verify webhook HMAC signatures.
 */
export interface CondorPayMedusaWompiConfig extends WompiConfig {
	/** Secret from Wompi Dashboard → Developers → Webhooks (Events integrity). */
	eventsIntegrityKey: string;
}

export interface BrebProviderOptions {
	wompi: CondorPayMedusaWompiConfig;
	breb?: BrebMerchantConfig;
}

export interface WompiProviderOptions {
	wompi: CondorPayMedusaWompiConfig;
}
