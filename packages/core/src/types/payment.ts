import type { Amount } from "./amount.js";

export enum PaymentStatus {
	PENDING = "PENDING",
	PROCESSING = "PROCESSING",
	COMPLETED = "COMPLETED",
	FAILED = "FAILED",
	CANCELLED = "CANCELLED",
	REFUNDED = "REFUNDED",
}

export interface PaymentRequest {
	id: string;
	amount: Amount;
	description: string;
	idempotencyKey: string;
	metadata?: Record<string, string>;
}

export interface PaymentResponse {
	id: string;
	status: PaymentStatus;
	amount: Amount;
	createdAt: string;
	updatedAt: string;
	metadata?: Record<string, string>;
}
