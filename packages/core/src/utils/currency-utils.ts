import { ValidationError } from "../errors/validation-error.js";
import type { Amount } from "../types/amount.js";
import { Currency } from "../types/currency.js";

const DECIMAL_PATTERN = /^\d+(\.\d+)?$/;

const CURRENCY_LOCALES: Record<Currency, string> = {
	[Currency.COP]: "es-CO",
	[Currency.MXN]: "es-MX",
	[Currency.BRL]: "pt-BR",
	[Currency.ARS]: "es-AR",
	[Currency.CLP]: "es-CL",
	[Currency.PEN]: "es-PE",
	[Currency.UYU]: "es-UY",
};

export function validateAmount(amount: Amount): void {
	const errors: Record<string, string> = {};

	if (!DECIMAL_PATTERN.test(amount.value)) {
		errors.value = "must be a valid positive decimal number";
	} else {
		const num = parseFloat(amount.value);
		if (num <= 0) {
			errors.value = "must be greater than zero";
		}
	}

	if (!Object.values(Currency).includes(amount.currency)) {
		errors.currency = `must be one of: ${Object.values(Currency).join(", ")}`;
	}

	if (Object.keys(errors).length > 0) {
		throw new ValidationError("Invalid amount", errors);
	}
}

export function parseAmount(value: string, currency: Currency): Amount {
	const amount: Amount = { value, currency };
	validateAmount(amount);
	return amount;
}

export function formatAmount(amount: Amount, locale?: string): string {
	const resolvedLocale = locale ?? CURRENCY_LOCALES[amount.currency] ?? "en-US";
	return new Intl.NumberFormat(resolvedLocale, {
		style: "currency",
		currency: amount.currency,
	}).format(parseFloat(amount.value));
}
