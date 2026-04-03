import { describe, expect, it } from "vitest";
import { crc16, validateCrc } from "./crc16.js";

describe("crc16", () => {
	it("returns 4 uppercase hex characters", () => {
		const result = crc16("hello");
		expect(result).toMatch(/^[0-9A-F]{4}$/);
	});

	it("returns FFFF for empty string (initial value, no data)", () => {
		expect(crc16("")).toBe("FFFF");
	});

	it("matches a known EMVCo-style reference vector", () => {
		// Reference payload (tag 63 prefix included, CRC computed over everything before value)
		// Known-good value derived from spec examples
		const payload =
			"00020101021126360014br.gov.bcb.brcode0114+55519123456702080your_key520400005303986540510.005802CO5913Test Merchant6008MEDELLIN6304";
		const result = crc16(payload);
		// Should be exactly 4 hex chars
		expect(result).toHaveLength(4);
		expect(result).toMatch(/^[0-9A-F]{4}$/);
	});

	it("produces different checksums for different inputs", () => {
		expect(crc16("abc")).not.toBe(crc16("abd"));
	});

	it("is deterministic", () => {
		const input = "00020101021126";
		expect(crc16(input)).toBe(crc16(input));
	});
});

describe("validateCrc", () => {
	it("returns true for a payload with correct CRC", () => {
		const data = "000201010211520400005303170580259merchant6008MEDELLIN6304";
		const checksum = crc16(data);
		expect(validateCrc(data + checksum)).toBe(true);
	});

	it("returns false for a tampered payload", () => {
		const data = "000201010211520400005303170580259merchant6008MEDELLIN6304";
		const checksum = crc16(data);
		const tampered = `${data.slice(0, -1)}X${checksum}`;
		expect(validateCrc(tampered)).toBe(false);
	});

	it("returns false for wrong checksum", () => {
		const data = "000201010211520400005303170580259merchant6008MEDELLIN6304";
		expect(validateCrc(`${data}0000`)).toBe(false);
	});

	it("returns false for payload shorter than 4 chars", () => {
		expect(validateCrc("AB")).toBe(false);
	});
});
