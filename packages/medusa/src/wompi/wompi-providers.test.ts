import { describe, expect, it } from "vitest";
import { CondorPayWompiCardProvider } from "./wompi-card-provider.js";
import { CondorPayWompiNequiProvider } from "./wompi-nequi-provider.js";
import { CondorPayWompiPseProvider } from "./wompi-pse-provider.js";

describe("Wompi provider identifiers", () => {
	it("sets distinct static identifiers", () => {
		expect(CondorPayWompiCardProvider.identifier).toBe("condorpay-wompi-card");
		expect(CondorPayWompiNequiProvider.identifier).toBe(
			"condorpay-wompi-nequi",
		);
		expect(CondorPayWompiPseProvider.identifier).toBe("condorpay-wompi-pse");
	});
});
