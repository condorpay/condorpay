import { Currency, NetworkError, ValidationError } from "@condorpay/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WompiPaymentLinkStatus, WompiPayoutStatus } from "./types.js";
import { WompiClient } from "./wompi-client.js";

function mockFetch(body: unknown, status = 200): void {
	vi.stubGlobal(
		"fetch",
		vi.fn().mockResolvedValue({
			ok: status >= 200 && status < 300,
			status,
			statusText: status === 200 ? "OK" : "Error",
			text: () => Promise.resolve(JSON.stringify(body)),
		}),
	);
}

// Mirrors an actual /payment_links response. The previous fixture returned the
// DOMAIN shape (url, amount, status, createdAt), so the pass-through mapper
// passed its tests while producing undefined for every one of those fields
// against the real API. Note there is no `url`: Wompi does not send one.
const LINK_RESPONSE = {
	data: {
		id: "link-001",
		name: "Test Link",
		description: "Test",
		amount_in_cents: 5000000,
		currency: "COP",
		single_use: true,
		collect_shipping: false,
		collect_customer_legal_id: false,
		active: true,
		expires_at: null,
		redirect_url: null,
		image_url: null,
		sku: null,
		customer_data: null,
		taxes: [],
		default_language: "es",
		created_at: "2026-04-02T00:00:00Z",
		updated_at: "2026-04-02T00:00:00Z",
		merchant_public_key: "pub_test_x",
	},
};

const PAYOUT_RESPONSE = {
	data: {
		id: "payout-001",
		status: WompiPayoutStatus.PENDING,
		amount: { value: "100000", currency: Currency.COP },
		currency: Currency.COP,
		reference: "ref-001",
		createdAt: "2026-04-02T00:00:00Z",
	},
};

describe("WompiClient", () => {
	let client: WompiClient;

	beforeEach(() => {
		client = new WompiClient({
			publicKey: "pub_test",
			privateKey: "priv_test",
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("creates an instance with required config", () => {
		expect(client).toBeInstanceOf(WompiClient);
	});

	it("creates an instance with sandbox URL", () => {
		const sandbox = new WompiClient({
			publicKey: "pub",
			privateKey: "priv",
			baseUrl: "https://sandbox.wompi.co/v1",
		});
		expect(sandbox).toBeInstanceOf(WompiClient);
	});

	describe("createPaymentLink", () => {
		it("returns a WompiPaymentLink on success", async () => {
			mockFetch(LINK_RESPONSE);
			const result = await client.createPaymentLink({
				name: "Test Link",
				amount: { value: "50000", currency: Currency.COP },
			});
			expect(result.id).toBe("link-001");
			// Derived from the id, because the API returns no URL.
			expect(result.url).toBe("https://checkout.wompi.co/l/link-001");
			expect(result.status).toBe(WompiPaymentLinkStatus.ACTIVE);
			// amount_in_cents -> major units, the unit the domain type uses.
			expect(result.amount).toEqual({
				value: "50000",
				currency: Currency.COP,
			});
			expect(result.createdAt).toBe("2026-04-02T00:00:00Z");
		});

		it("builds the checkout URL against a configured host", async () => {
			mockFetch(LINK_RESPONSE);
			const sandbox = new WompiClient({
				publicKey: "pub",
				privateKey: "priv",
				baseUrl: "https://sandbox.wompi.co/v1",
				checkoutUrl: "https://checkout.sandbox.wompi.co",
			});
			const result = await sandbox.createPaymentLink({
				name: "Test Link",
				amount: { value: "50000", currency: Currency.COP },
			});
			expect(result.url).toBe("https://checkout.sandbox.wompi.co/l/link-001");
		});

		it("maps an inactive link to INACTIVE", async () => {
			mockFetch({
				data: { ...LINK_RESPONSE.data, active: false },
			});
			const result = await client.createPaymentLink({
				name: "Test Link",
				amount: { value: "50000", currency: Currency.COP },
			});
			expect(result.status).toBe(WompiPaymentLinkStatus.INACTIVE);
		});

		it("throws ValidationError for non-COP currency", async () => {
			await expect(
				client.createPaymentLink({
					name: "Test",
					amount: { value: "100", currency: Currency.MXN },
				}),
			).rejects.toBeInstanceOf(ValidationError);
		});

		it("throws NetworkError on API error", async () => {
			mockFetch({ error: "Unauthorized" }, 401);
			await expect(
				client.createPaymentLink({
					name: "Test",
					amount: { value: "50000", currency: Currency.COP },
				}),
			).rejects.toBeInstanceOf(NetworkError);
		});
	});

	describe("getPaymentLink", () => {
		it("returns a WompiPaymentLink on success", async () => {
			mockFetch(LINK_RESPONSE);
			const result = await client.getPaymentLink("link-001");
			expect(result.id).toBe("link-001");
		});

		it("throws NetworkError on 404", async () => {
			mockFetch({ error: "Not Found" }, 404);
			const err = await client.getPaymentLink("missing").catch((e) => e);
			expect(err).toBeInstanceOf(NetworkError);
			expect((err as NetworkError).statusCode).toBe(404);
		});
	});

	describe("createPayout", () => {
		const payoutRequest = {
			amount: { value: "100000", currency: Currency.COP },
			reference: "ref-001",
			destinationBankAccount: {
				bankCode: "1007",
				accountNumber: "123456789",
				accountType: "SAVINGS_ACCOUNT" as const,
				holderName: "Juan Perez",
				holderIdType: "CC" as const,
				holderId: "12345678",
			},
		};

		it("returns a WompiPayout on success", async () => {
			mockFetch(PAYOUT_RESPONSE);
			const result = await client.createPayout(payoutRequest);
			expect(result.id).toBe("payout-001");
			expect(result.status).toBe(WompiPayoutStatus.PENDING);
		});

		it("throws ValidationError for non-COP currency", async () => {
			await expect(
				client.createPayout({
					...payoutRequest,
					amount: { value: "100", currency: Currency.MXN },
				}),
			).rejects.toBeInstanceOf(ValidationError);
		});
	});

	describe("getPayout", () => {
		it("returns a WompiPayout on success", async () => {
			mockFetch(PAYOUT_RESPONSE);
			const result = await client.getPayout("payout-001");
			expect(result.id).toBe("payout-001");
		});

		it("throws NetworkError on 404", async () => {
			mockFetch({ error: "Not Found" }, 404);
			const err = await client.getPayout("missing").catch((e) => e);
			expect(err).toBeInstanceOf(NetworkError);
			expect((err as NetworkError).statusCode).toBe(404);
		});
	});
});
