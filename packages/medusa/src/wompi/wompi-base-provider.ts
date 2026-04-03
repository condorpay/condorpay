import { WompiClient, WompiPaymentLinkStatus } from "@condorpay/co";
import type {
	AuthorizePaymentInput,
	AuthorizePaymentOutput,
	CancelPaymentInput,
	CancelPaymentOutput,
	CapturePaymentInput,
	CapturePaymentOutput,
	DeletePaymentInput,
	DeletePaymentOutput,
	GetPaymentStatusInput,
	GetPaymentStatusOutput,
	InitiatePaymentInput,
	InitiatePaymentOutput,
	PaymentSessionStatus,
	ProviderWebhookPayload,
	RefundPaymentInput,
	RefundPaymentOutput,
	RetrievePaymentInput,
	RetrievePaymentOutput,
	UpdatePaymentInput,
	UpdatePaymentOutput,
	WebhookActionResult,
} from "@medusajs/types";
import {
	AbstractPaymentProvider,
	BigNumber,
	MedusaError,
} from "@medusajs/utils";
import { medusaAmountToCondorPayAmount } from "../amount-utils.js";
import type { WompiProviderOptions } from "../types.js";
import {
	extractWompiSignatureFromHeaders,
	parseWompiWebhookFromMedusaPayload,
	wompiWebhookToMedusaResult,
} from "../webhook-utils.js";

function linkStatusToSessionStatus(
	status: WompiPaymentLinkStatus,
): PaymentSessionStatus {
	switch (status) {
		case WompiPaymentLinkStatus.ACTIVE:
			return "pending";
		case WompiPaymentLinkStatus.INACTIVE:
			return "authorized";
		case WompiPaymentLinkStatus.EXPIRED:
			return "canceled";
		default:
			return "pending";
	}
}

function readWompiId(data: Record<string, unknown> | undefined): string {
	if (data === undefined) {
		return "";
	}
	const id = data.wompiId;
	return typeof id === "string" ? id : "";
}

/**
 * Shared Wompi payment-link logic for card, Nequi, and PSE Medusa providers.
 */
export abstract class CondorPayWompiBaseProvider extends AbstractPaymentProvider<WompiProviderOptions> {
	private readonly opts: WompiProviderOptions;

	protected readonly wompi: WompiClient;

	constructor(
		cradle: Record<string, unknown>,
		options: WompiProviderOptions | undefined,
	) {
		super(cradle, options);
		if (options === undefined) {
			throw new MedusaError(
				MedusaError.Types.INVALID_DATA,
				"CondorPay Wompi providers require provider options in medusa-config.",
			);
		}
		this.opts = options;
		this.wompi = new WompiClient({
			publicKey: options.wompi.publicKey,
			privateKey: options.wompi.privateKey,
			baseUrl: options.wompi.baseUrl,
		});
	}

	static validateOptions(options: Record<string, unknown>): void {
		const o = options as unknown as WompiProviderOptions;
		if (
			!o?.wompi?.publicKey ||
			!o?.wompi?.privateKey ||
			!o?.wompi?.eventsIntegrityKey
		) {
			throw new MedusaError(
				MedusaError.Types.INVALID_DATA,
				"CondorPay Wompi providers require wompi.publicKey, wompi.privateKey, and wompi.eventsIntegrityKey.",
			);
		}
	}

	async initiatePayment(
		input: InitiatePaymentInput,
	): Promise<InitiatePaymentOutput> {
		const amount = medusaAmountToCondorPayAmount(
			input.amount,
			input.currency_code,
		);
		const link = await this.wompi.createPaymentLink({
			name: "CondorPay checkout",
			description: "Medusa order payment",
			amount,
			singleUse: true,
		});
		return {
			id: link.id,
			status: "pending",
			data: {
				wompiId: link.id,
				wompiUrl: link.url,
			},
		};
	}

	async authorizePayment(
		input: AuthorizePaymentInput,
	): Promise<AuthorizePaymentOutput> {
		return {
			status: "pending",
			data: input.data ?? {},
		};
	}

	async capturePayment(
		input: CapturePaymentInput,
	): Promise<CapturePaymentOutput> {
		return { data: input.data ?? {} };
	}

	async retrievePayment(
		input: RetrievePaymentInput,
	): Promise<RetrievePaymentOutput> {
		const wompiId = readWompiId(input.data);
		if (wompiId === "") {
			return { data: input.data ?? {} };
		}
		const link = await this.wompi.getPaymentLink(wompiId);
		return {
			data: {
				...(input.data ?? {}),
				wompiLink: link,
			},
		};
	}

	async getPaymentStatus(
		input: GetPaymentStatusInput,
	): Promise<GetPaymentStatusOutput> {
		const wompiId = readWompiId(input.data);
		if (wompiId === "") {
			return { status: "pending", data: input.data ?? {} };
		}
		const link = await this.wompi.getPaymentLink(wompiId);
		const status = linkStatusToSessionStatus(link.status);
		return {
			status,
			data: {
				...(input.data ?? {}),
				wompiStatus: link.status,
			},
		};
	}

	async getWebhookActionAndData(
		payload: ProviderWebhookPayload["payload"],
	): Promise<WebhookActionResult> {
		const event = parseWompiWebhookFromMedusaPayload(payload);
		if (event === null) {
			return {
				action: "not_supported",
				data: {
					session_id: "",
					amount: new BigNumber(0),
				},
			};
		}
		const signature = extractWompiSignatureFromHeaders(payload.headers);
		return wompiWebhookToMedusaResult(
			event,
			signature,
			this.opts.wompi.eventsIntegrityKey,
		);
	}

	async refundPayment(
		_input: RefundPaymentInput,
	): Promise<RefundPaymentOutput> {
		throw new MedusaError(
			MedusaError.Types.NOT_ALLOWED,
			"Refunds are not supported for Wompi payments in this release.",
		);
	}

	async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
		return { status: "pending", data: input.data ?? {} };
	}

	async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
		return { data: input.data ?? {} };
	}

	async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
		return { data: input.data ?? {} };
	}
}
