import { Currency } from "@condorpay/core";
import { describe, expect, it } from "vitest";
import { buildWompiCheckoutUrl } from "./checkout.js";

const BASE = {
	checkoutUrl: "https://checkout.wompi.co",
	publicKey: "pub_test_abc",
	integritySecret: "prod_integrity_secret",
};

describe("buildWompiCheckoutUrl", () => {
	it("reproduces the signature vector published by Wompi", async () => {
		// Straight from Wompi's docs: hashing
		//   sk8-438k4-xmxm392-sn2m2490000COPprod_integrity_Z5mMke9x0k8gpErbDqwrJXMqsI6SFli6
		// must yield this digest. If the concatenation order ever drifts, Wompi
		// rejects the checkout and this test is the only thing that catches it.
		const url = await buildWompiCheckoutUrl({
			...BASE,
			integritySecret: "prod_integrity_Z5mMke9x0k8gpErbDqwrJXMqsI6SFli6",
			request: {
				reference: "sk8-438k4-xmxm392-sn2m24",
				amount: { value: "900", currency: Currency.COP },
			},
		});
		expect(new URL(url).searchParams.get("signature:integrity")).toBe(
			"37c8407747e595535433ef8f6a811d853cd943046624a0ec04662b17bbf33bf5",
		);
	});

	it("carries the reference and the required checkout parameters", async () => {
		const url = new URL(
			await buildWompiCheckoutUrl({
				...BASE,
				request: {
					reference: "payses_01ABC",
					amount: { value: "2000", currency: Currency.COP },
					redirectUrl: "https://carpintec.com/checkout/confirmacion",
				},
			}),
		);
		expect(url.origin + url.pathname).toBe("https://checkout.wompi.co/p/");
		expect(url.searchParams.get("public-key")).toBe("pub_test_abc");
		expect(url.searchParams.get("currency")).toBe("COP");
		expect(url.searchParams.get("amount-in-cents")).toBe("200000");
		expect(url.searchParams.get("reference")).toBe("payses_01ABC");
		expect(url.searchParams.get("redirect-url")).toBe(
			"https://carpintec.com/checkout/confirmacion",
		);
	});

	it("folds the expiration into the signature when one is given", async () => {
		const withExpiry = await buildWompiCheckoutUrl({
			...BASE,
			request: {
				reference: "payses_01ABC",
				amount: { value: "2000", currency: Currency.COP },
				expirationTime: "2026-08-29T00:00:00.000Z",
			},
		});
		const withoutExpiry = await buildWompiCheckoutUrl({
			...BASE,
			request: {
				reference: "payses_01ABC",
				amount: { value: "2000", currency: Currency.COP },
			},
		});
		const sig = (u: string) =>
			new URL(u).searchParams.get("signature:integrity");
		expect(sig(withExpiry)).not.toBe(sig(withoutExpiry));
		expect(new URL(withExpiry).searchParams.get("expiration-time")).toBe(
			"2026-08-29T00:00:00.000Z",
		);
	});

	it("refuses to build an unsigned or unreferenced checkout", async () => {
		await expect(
			buildWompiCheckoutUrl({
				...BASE,
				integritySecret: "",
				request: {
					reference: "payses_01ABC",
					amount: { value: "2000", currency: Currency.COP },
				},
			}),
		).rejects.toThrow(/integritySecret/);

		await expect(
			buildWompiCheckoutUrl({
				...BASE,
				request: {
					reference: "",
					amount: { value: "2000", currency: Currency.COP },
				},
			}),
		).rejects.toThrow(/reference/);
	});
});
