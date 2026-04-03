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

const LINK_RESPONSE = {
	data: {
		id: "link-001",
		name: "Test Link",
		url: "https://checkout.wompi.co/l/abc123",
		amount: { value: "50000", currency: Currency.COP },
		currency: Currency.COP,
		status: WompiPaymentLinkStatus.ACTIVE,
		createdAt: "2026-04-02T00:00:00Z",
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
			expect(result.url).toBe("https://checkout.wompi.co/l/abc123");
			expect(result.status).toBe(WompiPaymentLinkStatus.ACTIVE);
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
