// CRC16-CCITT lookup table (polynomial 0x1021, initial value 0xFFFF)
// No input/output reflection (not CRC16-IBM variant)
const CRC16_TABLE: Uint16Array = (() => {
	const table = new Uint16Array(256);
	for (let i = 0; i < 256; i++) {
		let crc = i << 8;
		for (let j = 0; j < 8; j++) {
			crc = (crc & 0x8000) !== 0 ? (crc << 1) ^ 0x1021 : crc << 1;
		}
		table[i] = crc & 0xffff;
	}
	return table;
})();

export function crc16(input: string): string {
	let crc = 0xffff;
	for (let i = 0; i < input.length; i++) {
		const byte = input.charCodeAt(i) & 0xff;
		const tableValue = CRC16_TABLE[((crc >> 8) ^ byte) & 0xff] ?? 0;
		crc = ((crc << 8) ^ tableValue) & 0xffff;
	}
	return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function validateCrc(payload: string): boolean {
	if (payload.length < 4) return false;
	const data = payload.slice(0, -4);
	const embedded = payload.slice(-4).toUpperCase();
	return crc16(data) === embedded;
}
