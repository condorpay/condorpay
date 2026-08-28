import type { Amount } from "@condorpay/core";
import { Currency, HttpClient, ValidationError } from "@condorpay/core";
import type {
	CreatePaymentLinkRequest,
	CreatePayoutRequest,
	WompiConfig,
	WompiPaymentLink,
	WompiPaymentLinkResponse,
	WompiPayout,
} from "./types.js";
import { WompiPaymentLinkStatus } from "./types.js";

const WOMPI_PRODUCTION_URL = "https://production.wompi.co/v1";

// Wompi serves hosted payment links from a different host than the API, and it
// never returns the link URL in the response, so it has to be built from the id.
// Override it through WompiConfig.checkoutUrl when using the sandbox.
const WOMPI_PRODUCTION_CHECKOUT_URL = "https://checkout.wompi.co";

function assertCop(amount: Amount, field = "amount.currency"): void {
	if (amount.currency !== Currency.COP) {
		throw new ValidationError("Only COP amounts are supported", {
			[field]: `expected ${Currency.COP}, got ${amount.currency}`,
		});
	}
}

interface WompiResponse<T> {
	data: T;
}

export class WompiClient {
	private readonly http: HttpClient;
	private readonly publicKey: string;
	private readonly privateKey: string;
	private readonly checkoutUrl: string;

	constructor(config: WompiConfig) {
		this.publicKey = config.publicKey;
		this.privateKey = config.privateKey;
		this.checkoutUrl = (
			config.checkoutUrl ?? WOMPI_PRODUCTION_CHECKOUT_URL
		).replace(/\/+$/, "");
		this.http = new HttpClient({
			baseUrl: config.baseUrl ?? WOMPI_PRODUCTION_URL,
		});
	}

	async createPaymentLink(
		request: CreatePaymentLinkRequest,
	): Promise<WompiPaymentLink> {
		assertCop(request.amount);
		const body = {
			name: request.name,
			description: request.description,
			single_use: request.singleUse ?? false,
			collect_shipping: request.collectShipping ?? false,
			currency: "COP",
			amount_in_cents: Math.round(parseFloat(request.amount.value) * 100),
			expires_at: request.expiresAt,
			redirect_url: request.redirectUrl,
		};
		const resp = await this.http.post<WompiResponse<WompiPaymentLinkResponse>>(
			"/payment_links",
			{
				headers: { Authorization: `Bearer ${this.privateKey}` },
				body,
			},
		);
		return this.mapPaymentLink(resp.data);
	}

	async getPaymentLink(id: string): Promise<WompiPaymentLink> {
		const resp = await this.http.get<WompiResponse<WompiPaymentLinkResponse>>(
			`/payment_links/${id}`,
			{
				headers: { Authorization: `Bearer ${this.publicKey}` },
			},
		);
		return this.mapPaymentLink(resp.data);
	}

	async createPayout(request: CreatePayoutRequest): Promise<WompiPayout> {
		assertCop(request.amount);
		const body = {
			amount_in_cents: Math.round(parseFloat(request.amount.value) * 100),
			currency: "COP",
			reference: request.reference,
			description: request.description,
			destination: {
				bank_code: request.destinationBankAccount.bankCode,
				account_number: request.destinationBankAccount.accountNumber,
				account_type: request.destinationBankAccount.accountType,
				holder_name: request.destinationBankAccount.holderName,
				holder_id_type: request.destinationBankAccount.holderIdType,
				holder_id: request.destinationBankAccount.holderId,
			},
		};
		const resp = await this.http.post<WompiResponse<WompiPayout>>(
			"/transfers",
			{
				headers: { Authorization: `Bearer ${this.privateKey}` },
				body,
			},
		);
		return this.mapPayout(resp.data);
	}

	async getPayout(id: string): Promise<WompiPayout> {
		const resp = await this.http.get<WompiResponse<WompiPayout>>(
			`/transfers/${id}`,
			{
				headers: { Authorization: `Bearer ${this.privateKey}` },
			},
		);
		return this.mapPayout(resp.data);
	}

	/**
	 * Maps Wompi's snake_case response onto the domain object.
	 *
	 * This used to take a WompiPaymentLink and read camelCase properties off
	 * the raw payload, so `amount`, `status`, `createdAt` and `expiresAt` all
	 * came back undefined while TypeScript reported them as present. `url` was
	 * worse: Wompi does not return one at all, so consumers received a link
	 * object whose url was undefined and, once serialised to JSON, absent.
	 *
	 * The checkout URL is derived from the id, which is how Wompi's hosted
	 * payment links are addressed.
	 */
	private mapPaymentLink(raw: WompiPaymentLinkResponse): WompiPaymentLink {
		return {
			id: raw.id,
			name: raw.name,
			url: `${this.checkoutUrl}/l/${raw.id}`,
			amount: {
				value: String(raw.amount_in_cents / 100),
				currency: Currency.COP,
			},
			currency: Currency.COP,
			status: raw.active
				? WompiPaymentLinkStatus.ACTIVE
				: WompiPaymentLinkStatus.INACTIVE,
			createdAt: raw.created_at,
			expiresAt: raw.expires_at ?? undefined,
		};
	}

	private mapPayout(raw: WompiPayout): WompiPayout {
		return {
			id: raw.id,
			status: raw.status,
			amount: raw.amount,
			currency: Currency.COP,
			reference: raw.reference,
			createdAt: raw.createdAt,
			completedAt: raw.completedAt,
			errorMessage: raw.errorMessage,
		};
	}
}
