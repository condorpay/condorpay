import { buildPayload } from "./payload.js";
import { generateMatrix } from "./qr-matrix.js";
import { matrixToSvg } from "./qr-svg.js";
import type { BrebQrOptions, BrebQrResult } from "./types.js";

export function generateQr(options: BrebQrOptions): BrebQrResult {
	const payload = buildPayload(options);
	const matrix = generateMatrix(payload);
	const svg = matrixToSvg(matrix);
	return { payload, svg };
}
