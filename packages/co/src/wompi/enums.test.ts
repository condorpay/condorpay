import { describe, expect, it } from "vitest";
import {
	BankAccountType,
	IdType,
	WompiPaymentLinkStatus,
	WompiPayoutStatus,
	WompiTransactionStatus,
} from "./types.js";

describe("WompiPaymentLinkStatus", () => {
	it("contains ACTIVE, INACTIVE, EXPIRED", () => {
		expect(WompiPaymentLinkStatus.ACTIVE).toBe("ACTIVE");
		expect(WompiPaymentLinkStatus.INACTIVE).toBe("INACTIVE");
		expect(WompiPaymentLinkStatus.EXPIRED).toBe("EXPIRED");
		expect(Object.keys(WompiPaymentLinkStatus)).toHaveLength(3);
	});
});

describe("WompiTransactionStatus", () => {
	it("contains all five statuses", () => {
		expect(WompiTransactionStatus.PENDING).toBe("PENDING");
		expect(WompiTransactionStatus.APPROVED).toBe("APPROVED");
		expect(WompiTransactionStatus.DECLINED).toBe("DECLINED");
		expect(WompiTransactionStatus.VOIDED).toBe("VOIDED");
		expect(WompiTransactionStatus.ERROR).toBe("ERROR");
	});
});

describe("WompiPayoutStatus", () => {
	it("contains all five statuses", () => {
		expect(WompiPayoutStatus.PENDING).toBe("PENDING");
		expect(WompiPayoutStatus.PROCESSING).toBe("PROCESSING");
		expect(WompiPayoutStatus.COMPLETED).toBe("COMPLETED");
		expect(WompiPayoutStatus.FAILED).toBe("FAILED");
		expect(WompiPayoutStatus.REVERSED).toBe("REVERSED");
	});
});

describe("BankAccountType", () => {
	it("contains SAVINGS_ACCOUNT and CHECKING_ACCOUNT", () => {
		expect(BankAccountType.SAVINGS_ACCOUNT).toBe("SAVINGS_ACCOUNT");
		expect(BankAccountType.CHECKING_ACCOUNT).toBe("CHECKING_ACCOUNT");
		expect(Object.keys(BankAccountType)).toHaveLength(2);
	});
});

describe("IdType", () => {
	it("contains Colombian document types", () => {
		expect(IdType.CC).toBe("CC");
		expect(IdType.CE).toBe("CE");
		expect(IdType.NIT).toBe("NIT");
		expect(IdType.PP).toBe("PP");
		expect(Object.keys(IdType)).toHaveLength(4);
	});
});
