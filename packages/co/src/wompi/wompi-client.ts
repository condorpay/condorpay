import type { Amount } from "@condorpay/core";
import { Currency, HttpClient, ValidationError } from "@condorpay/core";
import type {
	CreatePaymentLinkRequest,
	CreatePayoutRequest,
	WompiConfig,
	WompiPaymentLink,
	WompiPayout,
} from "./types.js";

const WOMPI_PRODUCTION_URL = "https://production.wompi.co/v1";

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

	constructor(config: WompiConfig) {
		this.publicKey = config.publicKey;
		this.privateKey = config.privateKey;
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
		const resp = await this.http.post<WompiResponse<WompiPaymentLink>>(
			"/payment_links",
			{
				headers: { Authorization: `Bearer ${this.privateKey}` },
				body,
			},
		);
		return this.mapPaymentLink(resp.data);
	}

	async getPaymentLink(id: string): Promise<WompiPaymentLink> {
		const resp = await this.http.get<WompiResponse<WompiPaymentLink>>(
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

	private mapPaymentLink(raw: WompiPaymentLink): WompiPaymentLink {
		return {
			id: raw.id,
			name: raw.name,
			url: raw.url,
			amount: raw.amount,
			currency: Currency.COP,
			status: raw.status,
			createdAt: raw.createdAt,
			expiresAt: raw.expiresAt,
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
