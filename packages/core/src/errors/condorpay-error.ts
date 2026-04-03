import type { ErrorCode } from "./error-codes.js";

export class CondorPayError extends Error {
	readonly code: ErrorCode;
	override readonly cause: unknown;

	constructor(message: string, code: ErrorCode, cause?: unknown) {
		super(message, cause !== undefined ? { cause } : undefined);
		this.name = "CondorPayError";
		this.code = code;
		this.cause = cause;
		Object.setPrototypeOf(this, new.target.prototype);
	}
}
