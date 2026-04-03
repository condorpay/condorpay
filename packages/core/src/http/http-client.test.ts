import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorCode } from "../errors/error-codes.js";
import { NetworkError } from "../errors/network-error.js";
import { HttpClient } from "./http-client.js";

function mockFetch(response: Partial<Response> & { body?: string }): void {
	const { body = "", ...rest } = response;
	vi.stubGlobal(
		"fetch",
		vi.fn().mockResolvedValue({
			ok: (rest.status ?? 200) >= 200 && (rest.status ?? 200) < 300,
			status: 200,
			statusText: "OK",
			text: () => Promise.resolve(body),
			...rest,
		}),
	);
}

describe("HttpClient", () => {
	let client: HttpClient;

	beforeEach(() => {
		client = new HttpClient({ baseUrl: "https://api.example.com" });
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	describe("constructor", () => {
		it("creates an instance with base URL", () => {
			expect(client).toBeInstanceOf(HttpClient);
		});
	});

	describe("GET request", () => {
		it("returns parsed JSON on 2xx", async () => {
			mockFetch({ body: '{"id":"1","name":"test"}' });
			const result = await client.get<{ id: string; name: string }>("/items/1");
			expect(result).toEqual({ id: "1", name: "test" });
		});

		it("sends default headers on every request", async () => {
			const fetchMock = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				text: () => Promise.resolve("{}"),
			});
			vi.stubGlobal("fetch", fetchMock);

			const clientWithHeaders = new HttpClient({
				baseUrl: "https://api.example.com",
				defaultHeaders: { "X-Api-Key": "secret" },
			});
			await clientWithHeaders.get("/items");

			const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
			expect((options.headers as Record<string, string>)["X-Api-Key"]).toBe(
				"secret",
			);
		});

		it("per-request headers override defaults", async () => {
			const fetchMock = vi.fn().mockResolvedValue({
				ok: true,
				status: 200,
				text: () => Promise.resolve("{}"),
			});
			vi.stubGlobal("fetch", fetchMock);

			const clientWithHeaders = new HttpClient({
				baseUrl: "https://api.example.com",
				defaultHeaders: { "X-Api-Key": "default" },
			});
			await clientWithHeaders.get("/items", {
				headers: { "X-Api-Key": "override" },
			});

			const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
			expect((options.headers as Record<string, string>)["X-Api-Key"]).toBe(
				"override",
			);
		});
	});

	describe("POST request", () => {
		it("sends JSON body with Content-Type header", async () => {
			const fetchMock = vi.fn().mockResolvedValue({
				ok: true,
				status: 201,
				text: () => Promise.resolve('{"id":"new"}'),
			});
			vi.stubGlobal("fetch", fetchMock);

			await client.post<{ id: string }>("/items", { body: { name: "foo" } });

			const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
			expect((options.headers as Record<string, string>)["Content-Type"]).toBe(
				"application/json",
			);
			expect(options.body).toBe('{"name":"foo"}');
		});
	});

	describe("error handling", () => {
		it("throws NetworkError on 4xx response", async () => {
			mockFetch({
				ok: false,
				status: 404,
				statusText: "Not Found",
				body: '{"error":"not found"}',
			});
			await expect(client.get("/items/missing")).rejects.toBeInstanceOf(
				NetworkError,
			);
		});

		it("throws NetworkError with statusCode on 4xx", async () => {
			mockFetch({ ok: false, status: 404, statusText: "Not Found", body: "" });
			try {
				await client.get("/items/missing");
			} catch (err) {
				expect(err).toBeInstanceOf(NetworkError);
				expect((err as NetworkError).statusCode).toBe(404);
			}
		});

		it("throws NetworkError on 5xx response", async () => {
			mockFetch({
				ok: false,
				status: 500,
				statusText: "Internal Server Error",
				body: "",
			});
			await expect(client.get("/items")).rejects.toBeInstanceOf(NetworkError);
		});

		it("throws NetworkError with REQUEST_TIMEOUT on abort", async () => {
			vi.stubGlobal(
				"fetch",
				vi.fn().mockImplementation(() => {
					const err = new Error("AbortError");
					err.name = "AbortError";
					return Promise.reject(err);
				}),
			);

			const fastClient = new HttpClient({
				baseUrl: "https://api.example.com",
				timeoutMs: 1,
			});
			try {
				await fastClient.get("/slow");
			} catch (err) {
				expect(err).toBeInstanceOf(NetworkError);
				expect((err as NetworkError).code).toBe(ErrorCode.REQUEST_TIMEOUT);
			}
		});
	});
});
