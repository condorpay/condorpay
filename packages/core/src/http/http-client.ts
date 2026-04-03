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
				`HTTP ${response.status}: ${response.statusText}`,
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
