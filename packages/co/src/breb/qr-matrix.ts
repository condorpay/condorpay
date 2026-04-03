// Minimal QR code matrix generator supporting byte mode, ECC level M, versions 1-10.
// Based on the ISO/IEC 18004:2015 standard.

// ---------------------------------------------------------------------------
// Reed-Solomon GF(256) arithmetic
// ---------------------------------------------------------------------------

const GF_EXP = new Uint8Array(512);
const GF_LOG = new Uint8Array(256);

(() => {
	let x = 1;
	for (let i = 0; i < 255; i++) {
		GF_EXP[i] = x;
		GF_LOG[x] = i;
		x <<= 1;
		if (x & 0x100) x ^= 0x11d;
	}
	for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255] ?? 0;
})();

function gfMul(a: number, b: number): number {
	if (a === 0 || b === 0) return 0;
	return GF_EXP[((GF_LOG[a] ?? 0) + (GF_LOG[b] ?? 0)) % 255] ?? 0;
}

function rsGeneratorPoly(degree: number): Uint8Array {
	let poly = new Uint8Array([1]);
	for (let i = 0; i < degree; i++) {
		const next = new Uint8Array(poly.length + 1);
		const alpha = GF_EXP[i] ?? 0;
		for (let j = 0; j < poly.length; j++) {
			next[j] ^= poly[j] ?? 0;
			next[j + 1] ^= gfMul(poly[j] ?? 0, alpha);
		}
		poly = next;
	}
	return poly;
}

function rsEncode(data: Uint8Array, ecCount: number): Uint8Array {
	const gen = rsGeneratorPoly(ecCount);
	const msg = new Uint8Array(data.length + ecCount);
	msg.set(data);
	for (let i = 0; i < data.length; i++) {
		const coeff = msg[i] ?? 0;
		if (coeff !== 0) {
			for (let j = 0; j < gen.length; j++) {
				msg[i + j] ^= gfMul(gen[j] ?? 0, coeff);
			}
		}
	}
	return msg.slice(data.length);
}

// ---------------------------------------------------------------------------
// QR version capacity tables for ECC level M (byte mode)
// ---------------------------------------------------------------------------

// [version]: [dataCodewords, ecCodewords]
const VERSION_DATA: Record<number, [number, number]> = {
	1: [16, 10],
	2: [28, 16],
	3: [44, 26],
	4: [64, 36],
	5: [86, 48],
	6: [108, 64],
	7: [124, 72],
	8: [154, 88],
	9: [182, 110],
	10: [216, 130],
};

function selectVersion(dataLength: number): number {
	// byte mode: 4 bits mode + 8 bits char count + data * 8 + terminator
	for (const [ver, [dataWords]] of Object.entries(VERSION_DATA)) {
		const capacity = Math.floor((dataWords * 8 - 4 - 8) / 8);
		if (dataLength <= capacity) return Number(ver);
	}
	throw new Error(`QR: data too long (${dataLength} bytes, max ~185 bytes)`);
}

// ---------------------------------------------------------------------------
// Data encoding (byte mode)
// ---------------------------------------------------------------------------

function encodeData(text: string, version: number): Uint8Array {
	const entry = VERSION_DATA[version] ?? ([16, 10] as [number, number]);
	const [dataWords] = entry;
	const bytes = new TextEncoder().encode(text);
	const bits: number[] = [];

	// Mode indicator: 0100 = byte mode
	bits.push(0, 1, 0, 0);
	// Character count (8 bits for versions 1-9)
	for (let i = 7; i >= 0; i--) bits.push((bytes.length >> i) & 1);
	// Data bytes
	for (const byte of bytes) {
		for (let i = 7; i >= 0; i--) bits.push((byte >> i) & 1);
	}
	// Terminator (up to 4 zeros)
	for (let i = 0; i < 4 && bits.length < dataWords * 8; i++) bits.push(0);
	// Pad to byte boundary
	while (bits.length % 8 !== 0) bits.push(0);
	// Pad with alternating bytes
	const PAD_BYTES = [0xec, 0x11];
	let padIdx = 0;
	while (bits.length < dataWords * 8) {
		const pad = PAD_BYTES[padIdx++ % 2] ?? 0xec;
		for (let i = 7; i >= 0; i--) bits.push((pad >> i) & 1);
	}

	const result = new Uint8Array(dataWords);
	for (let i = 0; i < dataWords; i++) {
		let byte = 0;
		for (let j = 0; j < 8; j++) byte = (byte << 1) | (bits[i * 8 + j] ?? 0);
		result[i] = byte;
	}
	return result;
}

// ---------------------------------------------------------------------------
// Matrix placement helpers
// ---------------------------------------------------------------------------

type Module = 0 | 1 | -1; // -1 = reserved/function pattern

function makeMatrix(size: number): Module[][] {
	return Array.from({ length: size }, () => new Array<Module>(size).fill(-1));
}

function placeFinderPattern(
	matrix: Module[][],
	row: number,
	col: number,
): void {
	const pattern = [
		[1, 1, 1, 1, 1, 1, 1],
		[1, 0, 0, 0, 0, 0, 1],
		[1, 0, 1, 1, 1, 0, 1],
		[1, 0, 1, 1, 1, 0, 1],
		[1, 0, 1, 1, 1, 0, 1],
		[1, 0, 0, 0, 0, 0, 1],
		[1, 1, 1, 1, 1, 1, 1],
	];
	for (let r = 0; r < 7; r++) {
		for (let c = 0; c < 7; c++) {
			if (
				row + r >= 0 &&
				col + c >= 0 &&
				row + r < matrix.length &&
				col + c < matrix.length
			) {
				const matrixRow = matrix[row + r];
				if (matrixRow !== undefined)
					matrixRow[col + c] = pattern[r]?.[c] as Module;
			}
		}
	}
}

function placeSeparators(matrix: Module[][], size: number): void {
	// Separators (0s) around finder patterns
	for (let i = 0; i <= 7; i++) {
		if (i < size) {
			const row7 = matrix[7];
			const rowi = matrix[i];
			const rowSep = matrix[size - 8];
			if (row7 !== undefined) {
				row7[i] = 0;
				row7[size - 1 - i] = 0;
			}
			if (rowi !== undefined) {
				rowi[7] = 0;
				rowi[size - 8] = 0;
			}
			if (rowSep !== undefined) {
				rowSep[i] = 0;
				rowSep[size - 1 - i] = 0;
			}
		}
	}
}

// Alignment pattern centers for versions 2-10
const ALIGNMENT_CENTERS: Record<number, number[]> = {
	2: [6, 18],
	3: [6, 22],
	4: [6, 26],
	5: [6, 30],
	6: [6, 34],
	7: [6, 22, 38],
	8: [6, 24, 42],
	9: [6, 26, 46],
	10: [6, 28, 50],
};

function placeAlignmentPattern(matrix: Module[][], r: number, c: number): void {
	const pattern = [
		[1, 1, 1, 1, 1],
		[1, 0, 0, 0, 1],
		[1, 0, 1, 0, 1],
		[1, 0, 0, 0, 1],
		[1, 1, 1, 1, 1],
	];
	for (let dr = -2; dr <= 2; dr++) {
		for (let dc = -2; dc <= 2; dc++) {
			if (matrix[r + dr]?.[c + dc] === -1) {
				const alignRow = matrix[r + dr];
				if (alignRow !== undefined)
					alignRow[c + dc] = pattern[dr + 2]?.[dc + 2] as Module;
			}
		}
	}
}

function placeTimingPatterns(matrix: Module[][], size: number): void {
	const row6 = matrix[6];
	for (let i = 8; i < size - 8; i++) {
		const v = (i % 2 === 0 ? 1 : 0) as Module;
		if (row6 !== undefined && row6[i] === -1) row6[i] = v;
		const rowi = matrix[i];
		if (rowi !== undefined && rowi[6] === -1) rowi[6] = v;
	}
}

function placeDarkModule(matrix: Module[][], version: number): void {
	const row = matrix[4 * version + 9];
	if (row !== undefined) row[8] = 1;
}

function reserveFormatArea(matrix: Module[][], size: number): void {
	// Reserve format info areas with 0 (will be filled after masking)
	const row8 = matrix[8];
	const positions = [0, 1, 2, 3, 4, 5, 7, 8];
	for (const i of positions) {
		if (row8 !== undefined && row8[i] === -1) row8[i] = 0;
		const rowi = matrix[i];
		if (rowi !== undefined && rowi[8] === -1) rowi[8] = 0;
	}
	if (row8 !== undefined && row8[size - 8] === -1) row8[size - 8] = 0;
	for (let i = 0; i < 7; i++) {
		const rowMirror = matrix[size - 7 + i];
		if (rowMirror !== undefined && rowMirror[8] === -1) rowMirror[8] = 0;
		if (row8 !== undefined && row8[size - 7 + i] === -1) row8[size - 7 + i] = 0;
	}
}

// ---------------------------------------------------------------------------
// Data placement (zigzag)
// ---------------------------------------------------------------------------

function placeDataBits(matrix: Module[][], data: Uint8Array): void {
	const size = matrix.length;
	let bitIdx = 0;
	const totalBits = data.length * 8;

	let col = size - 1;
	let goingUp = true;

	while (col >= 0) {
		if (col === 6) col--; // skip timing column

		for (let rowOffset = 0; rowOffset < size; rowOffset++) {
			const row = goingUp ? size - 1 - rowOffset : rowOffset;
			for (let dc = 0; dc < 2; dc++) {
				const c = col - dc;
				const matRow = matrix[row];
				if (matRow !== undefined && matRow[c] === -1) {
					const bit =
						bitIdx < totalBits
							? ((data[Math.floor(bitIdx / 8)] ?? 0) >> (7 - (bitIdx % 8))) & 1
							: 0;
					matRow[c] = bit as Module;
					bitIdx++;
				}
			}
		}
		col -= 2;
		goingUp = !goingUp;
	}
}

// ---------------------------------------------------------------------------
// Masking
// ---------------------------------------------------------------------------

const MASK_PATTERNS: Array<(r: number, c: number) => boolean> = [
	(r, c) => (r + c) % 2 === 0,
	(r, _c) => r % 2 === 0,
	(_r, c) => c % 3 === 0,
	(r, c) => (r + c) % 3 === 0,
	(r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
	(r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
	(r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
	(r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

function applyMask(matrix: Module[][], maskIdx: number): Module[][] {
	const size = matrix.length;
	const masked = matrix.map((row) => [...row] as Module[]);
	const fn = MASK_PATTERNS[maskIdx];
	if (!fn) return masked;
	for (let r = 0; r < size; r++) {
		const matRow = matrix[r];
		const maskRow = masked[r];
		if (matRow === undefined || maskRow === undefined) continue;
		for (let c = 0; c < size; c++) {
			if (matRow[c] !== -1 && fn(r, c)) {
				maskRow[c] = (maskRow[c] === 0 ? 1 : 0) as Module;
			}
		}
	}
	return masked;
}

function penaltyScore(matrix: Module[][]): number {
	const size = matrix.length;
	let score = 0;
	// Rule 1: 5+ consecutive same-color modules in row/col
	for (let r = 0; r < size; r++) {
		for (let c = 0; c <= size - 5; c++) {
			const v = matrix[r]?.[c];
			if (
				matrix[r]?.[c + 1] === v &&
				matrix[r]?.[c + 2] === v &&
				matrix[r]?.[c + 3] === v &&
				matrix[r]?.[c + 4] === v
			) {
				let run = 5;
				while (c + run < size && matrix[r]?.[c + run] === v) run++;
				score += 3 + (run - 5);
			}
		}
		for (let c2 = 0; c2 <= size - 5; c2++) {
			const v = matrix[c2]?.[r];
			if (
				matrix[c2 + 1]?.[r] === v &&
				matrix[c2 + 2]?.[r] === v &&
				matrix[c2 + 3]?.[r] === v &&
				matrix[c2 + 4]?.[r] === v
			) {
				score += 3;
			}
		}
	}
	return score;
}

function selectMask(matrix: Module[][]): {
	masked: Module[][];
	maskIdx: number;
} {
	let best: Module[][] = matrix;
	let bestScore = Infinity;
	let bestIdx = 0;
	for (let i = 0; i < 8; i++) {
		const m = applyMask(matrix, i);
		const s = penaltyScore(m);
		if (s < bestScore) {
			bestScore = s;
			best = m;
			bestIdx = i;
		}
	}
	return { masked: best, maskIdx: bestIdx };
}

// ---------------------------------------------------------------------------
// Format information
// ---------------------------------------------------------------------------

// ECC level M = 0b00, shifted to format info bits
const ECC_LEVEL_M = 0b01; // format bits for level M

const FORMAT_MASK = 0b101010000010010;

function writeFormatInfo(matrix: Module[][], maskIdx: number): void {
	const size = matrix.length;
	// Format info: 2 bits ECC level + 3 bits mask, + 10 BCH bits
	const data = (ECC_LEVEL_M << 3) | maskIdx;
	const bch = calcFormatBCH(data);
	const format = ((data << 10) | bch) ^ FORMAT_MASK;

	const _positions = [0, 1, 2, 3, 4, 5, 7, 8, 7, 5, 4, 3, 2, 1, 0];
	const mirrorRow = [
		size - 1,
		size - 2,
		size - 3,
		size - 4,
		size - 5,
		size - 6,
		size - 7,
	];

	const row8 = matrix[8];
	const row7 = matrix[7];
	const rowSep = matrix[size - 8];

	for (let i = 0; i < 15; i++) {
		const bit = ((format >> (14 - i)) & 1) as Module;
		if (i < 6) {
			if (row8 !== undefined) row8[i] = bit;
			const rowi = matrix[i];
			if (rowi !== undefined) rowi[8] = bit;
		} else if (i === 6) {
			if (row8 !== undefined) row8[7] = bit;
			if (row7 !== undefined) row7[8] = bit;
		} else if (i === 7) {
			if (row8 !== undefined) row8[8] = bit;
			if (rowSep !== undefined) rowSep[8] = bit;
		} else {
			if (row8 !== undefined) row8[size - (15 - i)] = bit;
			const mirrorIdx = mirrorRow[i - 8] ?? 0;
			const mirrorR = matrix[mirrorIdx];
			if (mirrorR !== undefined) mirrorR[8] = bit;
		}
	}
	// Dark module
	if (rowSep !== undefined) rowSep[8] = 1;
}

function calcFormatBCH(data: number): number {
	let d = data << 10;
	const g = 0x537; // generator polynomial for format info
	for (let i = 14; i >= 10; i--) {
		if ((d >> i) & 1) d ^= g << (i - 10);
	}
	return d & 0x3ff;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function generateMatrix(text: string): boolean[][] {
	const version = selectVersion(text.length);
	const size = 17 + 4 * version;
	const versionEntry = VERSION_DATA[version] ?? ([16, 10] as [number, number]);
	const [, ecWords] = versionEntry;

	const matrix = makeMatrix(size);

	// Place finder patterns
	placeFinderPattern(matrix, 0, 0);
	placeFinderPattern(matrix, 0, size - 7);
	placeFinderPattern(matrix, size - 7, 0);
	placeSeparators(matrix, size);

	// Alignment patterns
	const centers = ALIGNMENT_CENTERS[version] ?? [];
	for (const r of centers) {
		for (const c of centers) {
			// Skip corners occupied by finder patterns
			if (
				!(
					(r <= 8 && c <= 8) ||
					(r <= 8 && c >= size - 8) ||
					(r >= size - 8 && c <= 8)
				)
			) {
				placeAlignmentPattern(matrix, r, c);
			}
		}
	}

	placeTimingPatterns(matrix, size);
	placeDarkModule(matrix, version);
	reserveFormatArea(matrix, size);

	// Encode data
	const encoded = encodeData(text, version);
	const ecBytes = rsEncode(encoded, ecWords);
	const allBytes = new Uint8Array(encoded.length + ecBytes.length);
	allBytes.set(encoded);
	allBytes.set(ecBytes, encoded.length);

	placeDataBits(matrix, allBytes);

	// Select mask and apply
	const { masked, maskIdx } = selectMask(matrix);

	// Write format information
	writeFormatInfo(masked, maskIdx);

	// Convert to boolean[][] (-1 treated as 0 for any remaining reserved cells)
	return masked.map((row) => row.map((v) => v === 1));
}
