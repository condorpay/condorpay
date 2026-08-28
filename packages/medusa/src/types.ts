import type { BrebMerchantConfig, WompiConfig } from "@condorpay/co";

/**
 * Wompi API credentials plus the two secrets a full checkout round trip needs.
 *
 * Wompi issues these as separate values and they are not interchangeable:
 * the events secret verifies webhooks coming in, the integrity secret signs
 * checkout URLs going out.
 */
export interface CondorPayMedusaWompiConfig extends WompiConfig {
	/** "Secreto para eventos" (prod_events_*). Verifies inbound webhooks. */
	eventsIntegrityKey: string;
	/** "Secreto de integridad" (prod_integrity_*). Signs Web Checkout URLs. */
	integritySecret: string;
	/**
	 * Where Wompi returns the shopper once the payment resolves. Without it the
	 * customer is stranded on Wompi's receipt with no way back to the store.
	 */
	redirectUrl?: string;
}

export interface BrebProviderOptions {
	wompi: CondorPayMedusaWompiConfig;
	breb?: BrebMerchantConfig;
}

export interface WompiProviderOptions {
	wompi: CondorPayMedusaWompiConfig;
}
