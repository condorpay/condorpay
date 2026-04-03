export function encodeTlv(tag: string, value: string): string {
	const paddedTag = tag.padStart(2, "0");
	const length = String(value.length).padStart(2, "0");
	return `${paddedTag}${length}${value}`;
}
