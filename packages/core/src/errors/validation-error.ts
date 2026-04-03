import { CondorPayError } from "./condorpay-error.js";
import { ErrorCode } from "./error-codes.js";

export class ValidationError extends CondorPayError {
	readonly fields: Record<string, string>;

	constructor(
		message: string,
		fields: Record<string, string>,
		cause?: unknown,
	) {
		super(message, ErrorCode.VALIDATION_ERROR, cause);
		this.name = "ValidationError";
		this.fields = fields;
		Object.setPrototypeOf(this, new.target.prototype);
	}
}
