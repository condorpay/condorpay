import { describe, expect, it } from "vitest";
import { generateQr } from "./breb-qr.js";
import { validateCrc } from "./crc16.js";

const BASE_OPTIONS = {
	merchantName: "Test Merchant",
	merchantCity: "Medellin",
	merchantAccountId: "123456789",
};

describe("generateQr", () => {
	it("returns an object with payload and svg", () => {
		const result = generateQr(BASE_OPTIONS);
		expect(result).toHaveProperty("payload");
		expect(result).toHaveProperty("svg");
	});

	it("payload is a non-empty string", () => {
		const result = generateQr(BASE_OPTIONS);
		expect(typeof result.payload).toBe("string");
		expect(result.payload.length).toBeGreaterThan(0);
	});

	it("svg starts with <svg", () => {
		const result = generateQr(BASE_OPTIONS);
		expect(result.svg.startsWith("<svg")).toBe(true);
	});

	it("svg contains <rect elements (QR modules)", () => {
		const result = generateQr(BASE_OPTIONS);
		expect(result.svg).toContain("<rect");
	});

	it("payload passes CRC validation", () => {
		const result = generateQr(BASE_OPTIONS);
		expect(validateCrc(result.payload)).toBe(true);
	});

	it("svg is self-contained (no external references)", () => {
		const result = generateQr(BASE_OPTIONS);
		expect(result.svg).not.toContain("href=");
		expect(result.svg).not.toContain("src=");
		expect(result.svg).not.toContain("xlink:");
	});
});
