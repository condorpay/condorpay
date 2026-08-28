import type { WompiTransaction } from "@condorpay/co";
import { WompiClient, WompiTransactionStatus } from "@condorpay/co";
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

function transactionStatusToSessionStatus(
	status: WompiTransactionStatus,
): PaymentSessionStatus {
	switch (status) {
		case WompiTransactionStatus.APPROVED:
			return "authorized";
		case WompiTransactionStatus.PENDING:
			return "pending";
		case WompiTransactionStatus.VOIDED:
			return "canceled";
		case WompiTransactionStatus.DECLINED:
		case WompiTransactionStatus.ERROR:
			return "error";
		default:
			return "pending";
	}
}

/**
 * The Medusa payment session id, which becomes the Wompi reference.
 *
 * Medusa creates the session first and then hands the provider its id twice
 * over: explicitly as `data.session_id`, and as the `context.idempotency_key`.
 * Either is authoritative; the explicit one is preferred.
 */
function readSessionId(input: InitiatePaymentInput): string {
	const fromData = input.data?.session_id;
	if (typeof fromData === "string" && fromData !== "") {
		return fromData;
	}
	const fromContext = input.context?.idempotency_key;
	return typeof fromContext === "string" ? fromContext : "";
}

function readWompiReference(data: Record<string, unknown> | undefined): string {
	const reference = data?.wompiReference;
	return typeof reference === "string" ? reference : "";
}

/**
 * Shared Wompi Web Checkout logic for card, Nequi, and PSE Medusa providers.
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
			checkoutUrl: options.wompi.checkoutUrl,
			integritySecret: options.wompi.integritySecret,
		});
	}

	static validateOptions(options: Record<string, unknown>): void {
		const o = options as unknown as WompiProviderOptions;
		if (
			!o?.wompi?.publicKey ||
			!o?.wompi?.privateKey ||
			!o?.wompi?.eventsIntegrityKey ||
			!o?.wompi?.integritySecret
		) {
			throw new MedusaError(
				MedusaError.Types.INVALID_DATA,
				"CondorPay Wompi providers require wompi.publicKey, wompi.privateKey, wompi.eventsIntegrityKey, and wompi.integritySecret.",
			);
		}
	}

	async initiatePayment(
		input: InitiatePaymentInput,
	): Promise<InitiatePaymentOutput> {
		const reference = readSessionId(input);
		if (reference === "") {
			// Failing here is far better than paying: without a reference Wompi
			// mints its own, the webhook comes back bearing an id Medusa has never
			// seen, and the shopper is charged for an order that is never created.
			throw new MedusaError(
				MedusaError.Types.UNEXPECTED_STATE,
				"Medusa did not supply a payment session id, so the Wompi payment could not be given a reference to match its webhook against.",
			);
		}

		const amount = medusaAmountToCondorPayAmount(
			input.amount,
			input.currency_code,
		);
		const wompiUrl = await this.wompi.buildCheckoutUrl({
			reference,
			amount,
			redirectUrl: this.opts.wompi.redirectUrl,
		});

		return {
			id: reference,
			status: "pending",
			data: { wompiReference: reference, wompiUrl },
		};
	}

	async authorizePayment(
		input: AuthorizePaymentInput,
	): Promise<AuthorizePaymentOutput> {
		const transaction = await this.findTransaction(input.data);
		if (transaction === null) {
			return { status: "pending", data: input.data ?? {} };
		}
		return {
			status: transactionStatusToSessionStatus(transaction.status),
			data: this.mergeTransaction(input.data, transaction),
		};
	}

	async capturePayment(
		input: CapturePaymentInput,
	): Promise<CapturePaymentOutput> {
		// Wompi settles an approved transaction on its own; there is nothing left
		// to capture, so this records the outcome rather than moving money.
		return { data: input.data ?? {} };
	}

	async retrievePayment(
		input: RetrievePaymentInput,
	): Promise<RetrievePaymentOutput> {
		const transaction = await this.findTransaction(input.data);
		if (transaction === null) {
			return { data: input.data ?? {} };
		}
		return { data: this.mergeTransaction(input.data, transaction) };
	}

	async getPaymentStatus(
		input: GetPaymentStatusInput,
	): Promise<GetPaymentStatusOutput> {
		const transaction = await this.findTransaction(input.data);
		if (transaction === null) {
			return { status: "pending", data: input.data ?? {} };
		}
		return {
			status: transactionStatusToSessionStatus(transaction.status),
			data: this.mergeTransaction(input.data, transaction),
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

	private async findTransaction(
		data: Record<string, unknown> | undefined,
	): Promise<WompiTransaction | null> {
		const reference = readWompiReference(data);
		if (reference === "") {
			return null;
		}
		return this.wompi.getTransactionByReference(reference);
	}

	private mergeTransaction(
		data: Record<string, unknown> | undefined,
		transaction: WompiTransaction,
	): Record<string, unknown> {
		return {
			...(data ?? {}),
			wompiTransactionId: transaction.id,
			wompiStatus: transaction.status,
		};
	}
}
