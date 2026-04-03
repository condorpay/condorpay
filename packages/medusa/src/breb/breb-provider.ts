import type { BrebQrOptions } from "@condorpay/co";
import { generateQr } from "@condorpay/co";
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
import type { BrebProviderOptions } from "../types.js";
import {
	extractWompiSignatureFromHeaders,
	parseWompiWebhookFromMedusaPayload,
	wompiWebhookToMedusaResult,
} from "../webhook-utils.js";

const PAYMENT_SESSION_STATUSES: readonly PaymentSessionStatus[] = [
	"authorized",
	"captured",
	"pending",
	"requires_more",
	"error",
	"canceled",
];

function parseSessionStatus(value: unknown): PaymentSessionStatus {
	if (typeof value !== "string") {
		return "pending";
	}
	for (const s of PAYMENT_SESSION_STATUSES) {
		if (value === s) {
			return s;
		}
	}
	return "pending";
}

function paymentSessionRefFromContext(
	context: InitiatePaymentInput["context"],
): string | undefined {
	if (context === undefined || context === null) {
		return undefined;
	}
	const extended = context as Record<string, unknown>;
	const id = extended.payment_session_id;
	return typeof id === "string" ? id : undefined;
}

/**
 * Medusa v2 payment provider for Bre-B (EMVCo) QR codes. Session data includes `payload` and `svg` for storefront rendering.
 */
export class CondorPayBrebProvider extends AbstractPaymentProvider<BrebProviderOptions> {
	static identifier = "condorpay-breb";

	private readonly opts: BrebProviderOptions;

	constructor(cradle: Record<string, unknown>, options?: BrebProviderOptions) {
		super(cradle, options);
		if (options === undefined) {
			throw new MedusaError(
				MedusaError.Types.INVALID_DATA,
				"CondorPayBrebProvider requires provider options in medusa-config.",
			);
		}
		this.opts = options;
	}

	static validateOptions(options: Record<string, unknown>): void {
		const o = options as unknown as BrebProviderOptions;
		if (
			!o?.wompi?.publicKey ||
			!o?.wompi?.privateKey ||
			!o?.wompi?.eventsIntegrityKey
		) {
			throw new MedusaError(
				MedusaError.Types.INVALID_DATA,
				"CondorPayBrebProvider requires wompi.publicKey, wompi.privateKey, and wompi.eventsIntegrityKey.",
			);
		}
	}

	async initiatePayment(
		input: InitiatePaymentInput,
	): Promise<InitiatePaymentOutput> {
		const breb = this.opts.breb;
		if (breb === undefined) {
			throw new MedusaError(
				MedusaError.Types.INVALID_DATA,
				"CondorPayBrebProvider requires breb merchant configuration (breb.merchantAccountId, breb.merchantName, breb.merchantCity).",
			);
		}

		const amount = medusaAmountToCondorPayAmount(
			input.amount,
			input.currency_code,
		);
		const ref = paymentSessionRefFromContext(input.context);
		const qrOptions: BrebQrOptions = {
			merchantAccountId: breb.merchantAccountId,
			merchantName: breb.merchantName,
			merchantCity: breb.merchantCity,
			merchantCategoryCode: breb.merchantCategoryCode,
			transactionAmount: amount,
			additionalData: ref !== undefined ? { referenceLabel: ref } : undefined,
		};
		const { payload, svg } = generateQr(qrOptions);
		const id = `breb:${crypto.randomUUID()}`;
		const generatedAt = new Date().toISOString();

		return {
			id,
			status: "pending",
			data: {
				payload,
				svg,
				generatedAt,
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

	async getPaymentStatus(
		input: GetPaymentStatusInput,
	): Promise<GetPaymentStatusOutput> {
		const data = input.data ?? {};
		const status = parseSessionStatus(data.status);
		return { status, data };
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
			"Refunds are not supported for Bre-B payments in this release.",
		);
	}

	async retrievePayment(
		input: RetrievePaymentInput,
	): Promise<RetrievePaymentOutput> {
		return { data: input.data ?? {} };
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
