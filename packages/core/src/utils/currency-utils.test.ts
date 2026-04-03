import { describe, expect, it } from "vitest";
import { ValidationError } from "../errors/validation-error.js";
import { Currency } from "../types/currency.js";
import { formatAmount, parseAmount, validateAmount } from "./currency-utils.js";

describe("validateAmount", () => {
	it("passes for a valid decimal string amount", () => {
		expect(() =>
			validateAmount({ value: "100.50", currency: Currency.BRL }),
		).not.toThrow();
	});

	it("passes for an integer string amount", () => {
		expect(() =>
			validateAmount({ value: "500", currency: Currency.COP }),
		).not.toThrow();
	});

	it("throws ValidationError for zero value", () => {
		expect(() =>
			validateAmount({ value: "0", currency: Currency.COP }),
		).toThrow(ValidationError);
	});

	it("throws ValidationError for negative value", () => {
		expect(() =>
			validateAmount({ value: "-50", currency: Currency.MXN }),
		).toThrow(ValidationError);
	});

	it("throws ValidationError for non-numeric string", () => {
		expect(() =>
			validateAmount({ value: "abc", currency: Currency.COP }),
		).toThrow(ValidationError);
	});

	it("throws ValidationError for empty string", () => {
		expect(() => validateAmount({ value: "", currency: Currency.COP })).toThrow(
			ValidationError,
		);
	});

	it("includes field error on value for zero", () => {
		try {
			validateAmount({ value: "0", currency: Currency.COP });
		} catch (err) {
			expect(err).toBeInstanceOf(ValidationError);
			expect((err as ValidationError).fields.value).toBeTruthy();
		}
	});
});

describe("parseAmount", () => {
	it("returns Amount for valid inputs", () => {
		const amount = parseAmount("250.00", Currency.PEN);
		expect(amount).toEqual({ value: "250.00", currency: Currency.PEN });
	});

	it("throws ValidationError for empty string", () => {
		expect(() => parseAmount("", Currency.CLP)).toThrow(ValidationError);
	});

	it("throws ValidationError for negative value", () => {
		expect(() => parseAmount("-10", Currency.MXN)).toThrow(ValidationError);
	});
});

describe("formatAmount", () => {
	it("returns a non-empty string for COP with default locale", () => {
		const result = formatAmount({ value: "100000", currency: Currency.COP });
		expect(result).toBeTruthy();
		expect(typeof result).toBe("string");
	});

	it("returns a formatted string with explicit locale", () => {
		const result = formatAmount(
			{ value: "1500.50", currency: Currency.MXN },
			"es-MX",
		);
		expect(result).toBeTruthy();
		expect(result).toContain("1");
	});

	it("uses currency-specific default locale", () => {
		const cop = formatAmount({ value: "1000", currency: Currency.COP });
		const brl = formatAmount({ value: "1000", currency: Currency.BRL });
		expect(cop).toBeTruthy();
		expect(brl).toBeTruthy();
	});
});
