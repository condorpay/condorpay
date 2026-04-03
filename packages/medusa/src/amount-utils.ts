import type { Amount } from "@condorpay/core";
import { Currency } from "@condorpay/core";
import type { BigNumberInput } from "@medusajs/types";
import { BigNumber, MedusaError } from "@medusajs/utils";

/**
 * Converts a Medusa payment amount to CondorPay {@link Amount} (COP major units only).
 *
 * @param amount - Medusa {@link BigNumberInput}
 * @param currencyCode - ISO 4217 code (case-insensitive)
 * @returns CondorPay amount in COP
 * @throws MedusaError when currency is not COP
 */
export function medusaAmountToCondorPayAmount(
	amount: BigNumberInput,
	currencyCode: string,
): Amount {
	const code = currencyCode.toLowerCase();
	if (code !== "cop") {
		throw new MedusaError(
			MedusaError.Types.INVALID_DATA,
			`Only COP currency is supported, got ${currencyCode}`,
		);
	}
	const bn = new BigNumber(amount);
	return {
		value: String(bn.numeric),
		currency: Currency.COP,
	};
}
