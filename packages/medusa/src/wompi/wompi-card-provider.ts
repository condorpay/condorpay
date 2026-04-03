import { CondorPayWompiBaseProvider } from "./wompi-base-provider.js";

/**
 * Wompi credit/debit card payments via payment link.
 */
export class CondorPayWompiCardProvider extends CondorPayWompiBaseProvider {
	static identifier = "condorpay-wompi-card";
}
