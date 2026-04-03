import { Currency } from "@condorpay/core";
import { describe, expect, it } from "vitest";
import { validateCrc } from "./crc16.js";
import { buildPayload } from "./payload.js";

const BASE_OPTIONS = {
	merchantName: "Test Merchant",
	merchantCity: "Medellin",
	merchantAccountId: "123456789012345",
};

describe("buildPayload", () => {
	it("starts with 000201 (Payload Format Indicator tag 00, value 01)", () => {
		const payload = buildPayload(BASE_OPTIONS);
		expect(payload.startsWith("000201")).toBe(true);
	});

	it("ends with 6304 + 4-char CRC", () => {
		const payload = buildPayload(BASE_OPTIONS);
		expect(payload).toMatch(/6304[0-9A-F]{4}$/);
	});

	it("produces a payload with valid CRC (validateCrc returns true)", () => {
		const payload = buildPayload(BASE_OPTIONS);
		expect(validateCrc(payload)).toBe(true);
	});

	it("uses tag 01 = '11' for static QR (no amount)", () => {
		const payload = buildPayload(BASE_OPTIONS);
		expect(payload).toContain("010211");
	});

	it("uses tag 01 = '12' for dynamic QR (with amount)", () => {
		const payload = buildPayload({
			...BASE_OPTIONS,
			transactionAmount: { value: "100.50", currency: Currency.COP },
		});
		expect(payload).toContain("010212");
	});

	it("includes tag 54 with amount when transactionAmount is provided", () => {
		const payload = buildPayload({
			...BASE_OPTIONS,
			transactionAmount: { value: "250.00", currency: Currency.COP },
		});
		expect(payload).toContain("5406250.00");
	});

	it("includes country code CO (tag 58)", () => {
		const payload = buildPayload(BASE_OPTIONS);
		expect(payload).toContain("5802CO");
	});

	it("includes currency 170 (COP, tag 53)", () => {
		const payload = buildPayload(BASE_OPTIONS);
		expect(payload).toContain("5303170");
	});

	it("includes merchant name (tag 59)", () => {
		const payload = buildPayload(BASE_OPTIONS);
		expect(payload).toContain("Test Merchant");
	});

	it("includes merchant city (tag 60)", () => {
		const payload = buildPayload(BASE_OPTIONS);
		expect(payload).toContain("Medellin");
	});

	it("includes tag 62 with reference label when additionalData is provided", () => {
		const payload = buildPayload({
			...BASE_OPTIONS,
			additionalData: { referenceLabel: "REF001" },
		});
		expect(payload).toContain("REF001");
	});

	it("uses default MCC 0000 when not specified", () => {
		const payload = buildPayload(BASE_OPTIONS);
		expect(payload).toContain("52040000");
	});

	it("uses custom MCC when specified", () => {
		const payload = buildPayload({
			...BASE_OPTIONS,
			merchantCategoryCode: "5411",
		});
		expect(payload).toContain("52045411");
	});
});
