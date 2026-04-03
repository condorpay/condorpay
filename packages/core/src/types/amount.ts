import type { Currency } from "./currency.js";

export interface Amount {
	value: string;
	currency: Currency;
}
