import { crc16 } from "./crc16.js";
import { encodeTlv } from "./tlv.js";
import type { BrebQrOptions } from "./types.js";

const BREB_MERCHANT_ACCOUNT_GUID = "br.gov.bcb.brcode";

export function buildPayload(options: BrebQrOptions): string {
	const mcc = options.merchantCategoryCode ?? "0000";
	const isDynamic = options.transactionAmount !== undefined;

	// Tag 00 — Payload Format Indicator
	let payload = encodeTlv("00", "01");

	// Tag 01 — Point of Initiation Method (11 = static, 12 = dynamic)
	payload += encodeTlv("01", isDynamic ? "12" : "11");

	// Tag 26 — Merchant Account Information (Bre-B)
	const merchantAccountInfo =
		encodeTlv("00", BREB_MERCHANT_ACCOUNT_GUID) +
		encodeTlv("01", options.merchantAccountId);
	payload += encodeTlv("26", merchantAccountInfo);

	// Tag 52 — Merchant Category Code
	payload += encodeTlv("52", mcc);

	// Tag 53 — Transaction Currency (170 = COP)
	payload += encodeTlv("53", "170");

	// Tag 54 — Transaction Amount (optional)
	if (options.transactionAmount !== undefined) {
		payload += encodeTlv("54", options.transactionAmount.value);
	}

	// Tag 58 — Country Code
	payload += encodeTlv("58", "CO");

	// Tag 59 — Merchant Name
	payload += encodeTlv("59", options.merchantName.slice(0, 25));

	// Tag 60 — Merchant City
	payload += encodeTlv("60", options.merchantCity.slice(0, 15));

	// Tag 62 — Additional Data Field Template (optional)
	if (options.additionalData?.referenceLabel) {
		const additionalData = encodeTlv(
			"05",
			options.additionalData.referenceLabel,
		);
		payload += encodeTlv("62", additionalData);
	}

	// Tag 63 — CRC (CRC is computed over the full payload including the "6304" prefix)
	const crcPrefix = "6304";
	const checksum = crc16(payload + crcPrefix);
	payload += crcPrefix + checksum;

	return payload;
}
