import type { PaymentRequest, PaymentResponse } from "@condorpay/core";
import {
	AbstractPaymentProvider,
	CondorPayError,
	Currency,
	ErrorCode,
	HttpClient,
	PaymentStatus,
	ValidationError,
} from "@condorpay/core";
import type { BrebMerchantConfig } from "../breb/breb-merchant-config.js";
import { generateQr } from "../breb/breb-qr.js";
import type { BrebQrOptions, BrebQrResult } from "../breb/types.js";
import type { WompiConfig } from "../wompi/types.js";
import { WompiPaymentLinkStatus } from "../wompi/types.js";
import { WompiClient } from "../wompi/wompi-client.js";

export interface CondorPayCoConfig {
	wompi: WompiConfig;
	breb?: BrebMerchantConfig;
}

const WOMPI_STATUS_MAP: Record<WompiPaymentLinkStatus, PaymentStatus> = {
	[WompiPaymentLinkStatus.ACTIVE]: PaymentStatus.PENDING,
	[WompiPaymentLinkStatus.INACTIVE]: PaymentStatus.COMPLETED,
	[WompiPaymentLinkStatus.EXPIRED]: PaymentStatus.CANCELLED,
};

export class CondorPayCo extends AbstractPaymentProvider {
	readonly name = "condorpay-co";

	private readonly wompi: WompiClient;

	constructor(config: CondorPayCoConfig) {
		const http = new HttpClient({
			baseUrl: config.wompi.baseUrl ?? "https://production.wompi.co/v1",
		});
		super(http);
		this.wompi = new WompiClient(config.wompi);
	}

	async createPayment(request: PaymentRequest): Promise<PaymentResponse> {
		if (request.amount.currency !== Currency.COP) {
			throw new ValidationError("Only COP amounts are supported for Colombia", {
				"amount.currency": `expected ${Currency.COP}, got ${request.amount.currency}`,
			});
		}

		const link = await this.wompi.createPaymentLink({
			name: request.description,
			amount: request.amount,
			singleUse: true,
		});

		return {
			id: link.id,
			status: PaymentStatus.PENDING,
			amount: request.amount,
			createdAt: link.createdAt,
			updatedAt: link.createdAt,
			metadata: {
				wompiUrl: link.url,
				...(request.metadata ?? {}),
			},
		};
	}

	async getPayment(id: string): Promise<PaymentResponse> {
		const link = await this.wompi.getPaymentLink(id);
		const status = WOMPI_STATUS_MAP[link.status] ?? PaymentStatus.PENDING;

		return {
			id: link.id,
			status,
			amount: link.amount,
			createdAt: link.createdAt,
			updatedAt: link.createdAt,
			metadata: {
				wompiUrl: link.url,
				wompiStatus: link.status,
			},
		};
	}

	async cancelPayment(id: string): Promise<PaymentResponse> {
		const link = await this.wompi.getPaymentLink(id);

		if (link.status === WompiPaymentLinkStatus.EXPIRED) {
			throw new CondorPayError(
				`Payment ${id} is already cancelled/expired`,
				ErrorCode.PAYMENT_ALREADY_CANCELLED,
			);
		}

		throw new CondorPayError(
			"Cancelling Wompi payment links is not supported. Payment links expire automatically.",
			ErrorCode.UNKNOWN_ERROR,
		);
	}

	generateQr(options: BrebQrOptions): BrebQrResult {
		return generateQr(options);
	}
}
