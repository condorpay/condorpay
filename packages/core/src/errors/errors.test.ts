import { describe, expect, it } from "vitest";
import { CondorPayError } from "./condorpay-error.js";
import { ErrorCode } from "./error-codes.js";
import { NetworkError } from "./network-error.js";
import { ValidationError } from "./validation-error.js";

describe("ErrorCode", () => {
	it("contains all seven initial codes", () => {
		expect(ErrorCode.UNKNOWN_ERROR).toBe("UNKNOWN_ERROR");
		expect(ErrorCode.NETWORK_ERROR).toBe("NETWORK_ERROR");
		expect(ErrorCode.REQUEST_TIMEOUT).toBe("REQUEST_TIMEOUT");
		expect(ErrorCode.INVALID_RESPONSE).toBe("INVALID_RESPONSE");
		expect(ErrorCode.VALIDATION_ERROR).toBe("VALIDATION_ERROR");
		expect(ErrorCode.PAYMENT_NOT_FOUND).toBe("PAYMENT_NOT_FOUND");
		expect(ErrorCode.PAYMENT_ALREADY_CANCELLED).toBe(
			"PAYMENT_ALREADY_CANCELLED",
		);
	});
});

describe("CondorPayError", () => {
	it("is an instance of Error", () => {
		const err = new CondorPayError("something failed", ErrorCode.UNKNOWN_ERROR);
		expect(err).toBeInstanceOf(Error);
	});

	it("is an instance of CondorPayError", () => {
		const err = new CondorPayError("something failed", ErrorCode.UNKNOWN_ERROR);
		expect(err).toBeInstanceOf(CondorPayError);
	});

	it("carries a code", () => {
		const err = new CondorPayError("msg", ErrorCode.UNKNOWN_ERROR);
		expect(err.code).toBe(ErrorCode.UNKNOWN_ERROR);
	});

	it("carries a message", () => {
		const err = new CondorPayError("test message", ErrorCode.UNKNOWN_ERROR);
		expect(err.message).toBe("test message");
	});

	it("carries an optional cause", () => {
		const cause = new Error("root cause");
		const err = new CondorPayError("wrapper", ErrorCode.UNKNOWN_ERROR, cause);
		expect(err.cause).toBe(cause);
	});
});

describe("NetworkError", () => {
	it("is instanceof CondorPayError", () => {
		const err = new NetworkError("network fail");
		expect(err).toBeInstanceOf(CondorPayError);
	});

	it("is instanceof Error", () => {
		const err = new NetworkError("network fail");
		expect(err).toBeInstanceOf(Error);
	});

	it("defaults to NETWORK_ERROR code", () => {
		const err = new NetworkError("network fail");
		expect(err.code).toBe(ErrorCode.NETWORK_ERROR);
	});

	it("carries statusCode", () => {
		const err = new NetworkError("not found", { statusCode: 404 });
		expect(err.statusCode).toBe(404);
	});

	it("carries responseBody", () => {
		const err = new NetworkError("server error", {
			statusCode: 500,
			responseBody: '{"error":"oops"}',
		});
		expect(err.responseBody).toBe('{"error":"oops"}');
	});

	it("uses REQUEST_TIMEOUT code when specified", () => {
		const err = new NetworkError("timed out", {
			code: ErrorCode.REQUEST_TIMEOUT,
		});
		expect(err.code).toBe(ErrorCode.REQUEST_TIMEOUT);
	});
});

describe("ValidationError", () => {
	it("is instanceof CondorPayError", () => {
		const err = new ValidationError("invalid", { amount: "must be positive" });
		expect(err).toBeInstanceOf(CondorPayError);
	});

	it("is instanceof Error", () => {
		const err = new ValidationError("invalid", { amount: "must be positive" });
		expect(err).toBeInstanceOf(Error);
	});

	it("has VALIDATION_ERROR code", () => {
		const err = new ValidationError("invalid", {});
		expect(err.code).toBe(ErrorCode.VALIDATION_ERROR);
	});

	it("exposes field errors", () => {
		const err = new ValidationError("invalid", { amount: "must be positive" });
		expect(err.fields.amount).toBe("must be positive");
	});
});
