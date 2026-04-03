import { CondorPayWompiBaseProvider } from "./wompi-base-provider.js";

/**
 * Wompi PSE bank transfer payments via payment link.
 */
export class CondorPayWompiPseProvider extends CondorPayWompiBaseProvider {
	static identifier = "condorpay-wompi-pse";
}
