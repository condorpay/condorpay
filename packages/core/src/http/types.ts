export interface HttpClientOptions {
	baseUrl: string;
	defaultHeaders?: Record<string, string>;
	timeoutMs?: number;
}

export interface RequestOptions {
	headers?: Record<string, string>;
	body?: unknown;
}
