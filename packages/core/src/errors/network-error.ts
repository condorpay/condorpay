import { CondorPayError } from "./condorpay-error.js";
import { ErrorCode } from "./error-codes.js";

export class NetworkError extends CondorPayError {
	readonly statusCode?: number;
	readonly responseBody?: string;

	constructor(
		message: string,
		options?: {
			code?: ErrorCode;
			statusCode?: number;
			responseBody?: string;
			cause?: unknown;
		},
	) {
		super(message, options?.code ?? ErrorCode.NETWORK_ERROR, options?.cause);
		this.name = "NetworkError";
		this.statusCode = options?.statusCode;
		this.responseBody = options?.responseBody;
		Object.setPrototypeOf(this, new.target.prototype);
	}
}
