import type { HttpClient } from "../http/http-client.js";
import type { PaymentRequest, PaymentResponse } from "../types/payment.js";

export abstract class AbstractPaymentProvider {
	abstract readonly name: string;

	protected readonly http: HttpClient;

	constructor(http: HttpClient) {
		this.http = http;
	}

	abstract createPayment(request: PaymentRequest): Promise<PaymentResponse>;

	abstract getPayment(id: string): Promise<PaymentResponse>;

	abstract cancelPayment(id: string): Promise<PaymentResponse>;
}
