import { ErrorCode } from "../errors/error-codes.js";
import { NetworkError } from "../errors/network-error.js";
import type { HttpClientOptions, RequestOptions } from "./types.js";

const DEFAULT_TIMEOUT_MS = 30_000;

export class HttpClient {
	private readonly baseUrl: string;
	private readonly defaultHeaders: Record<string, string>;
	private readonly timeoutMs: number;

	constructor(options: HttpClientOptions) {
		this.baseUrl = options.baseUrl.replace(/\/$/, "");
		this.defaultHeaders = options.defaultHeaders ?? {};
		this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
	}

	async get<T>(
		path: string,
		options?: Omit<RequestOptions, "body">,
	): Promise<T> {
		return this.request<T>("GET", path, options);
	}

	async post<T>(path: string, options?: RequestOptions): Promise<T> {
		return this.request<T>("POST", path, options);
	}

	async put<T>(path: string, options?: RequestOptions): Promise<T> {
		return this.request<T>("PUT", path, options);
	}

	async patch<T>(path: string, options?: RequestOptions): Promise<T> {
		return this.request<T>("PATCH", path, options);
	}

	async delete<T>(
		path: string,
		options?: Omit<RequestOptions, "body">,
	): Promise<T> {
		return this.request<T>("DELETE", path, options);
	}

	private async request<T>(
		method: string,
		path: string,
		options?: RequestOptions,
	): Promise<T> {
		const url = `${this.baseUrl}${path}`;
		const headers: Record<string, string> = {
			"Content-Type": "application/json",
			...this.defaultHeaders,
			...options?.headers,
		};

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

		let response: Response;
		try {
			response = await fetch(url, {
				method,
				headers,
				body:
					options?.body !== undefined
						? JSON.stringify(options.body)
						: undefined,
				signal: controller.signal,
			});
		} catch (err) {
			if (err instanceof Error && err.name === "AbortError") {
				throw new NetworkError(`Request timed out after ${this.timeoutMs}ms`, {
					code: ErrorCode.REQUEST_TIMEOUT,
					cause: err,
				});
			}
			throw new NetworkError("Network request failed", {
				code: ErrorCode.NETWORK_ERROR,
				cause: err,
			});
		} finally {
			clearTimeout(timeoutId);
		}

		if (!response.ok) {
			const body = await response.text().catch(() => "");
			throw new NetworkError(
				describeHttpError(response.status, response.statusText, body),
				{
					code: ErrorCode.NETWORK_ERROR,
					statusCode: response.status,
					responseBody: body,
				},
			);
		}

		const text = await response.text();
		if (!text) {
			return undefined as T;
		}

		try {
			return JSON.parse(text) as T;
		} catch (err) {
			throw new NetworkError("Failed to parse response body as JSON", {
				code: ErrorCode.INVALID_RESPONSE,
				responseBody: text,
				cause: err,
			});
		}
	}
}

/**
 * Builds an error message that carries the provider's own explanation.
 *
 * The body was already captured in `responseBody`, but a message of just
 * "HTTP 422: Unprocessable Entity" forces whoever is integrating to reproduce
 * the call by hand to find out which field the provider rejected. Wompi, for
 * example, answers with a `reason` that says exactly what went wrong.
 */
function describeHttpError(
	status: number,
	statusText: string,
	body: string,
): string {
	const base = `HTTP ${status}: ${statusText}`;
	if (!body) {
		return base;
	}

	let detail: string | undefined;
	try {
		const parsed = JSON.parse(body) as {
			error?: { reason?: unknown; messages?: unknown; type?: unknown };
			message?: unknown;
		};
		const error = parsed.error;

		if (typeof error?.reason === "string") {
			detail = error.reason;
		} else if (error?.messages && typeof error.messages === "object") {
			detail = Object.entries(error.messages as Record<string, unknown>)
				.map(([field, value]) => `${field}: ${String(value)}`)
				.join("; ");
		} else if (typeof error?.type === "string") {
			detail = error.type;
		} else if (typeof parsed.message === "string") {
			detail = parsed.message;
		}
	} catch {
		// Not JSON. A short raw body is still more useful than nothing.
		detail = body.length <= 200 ? body : undefined;
	}

	return detail ? `${base} - ${detail}` : base;
}
