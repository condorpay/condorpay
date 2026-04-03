export function matrixToSvg(matrix: boolean[][]): string {
	const size = matrix.length;
	const quiet = 4; // quiet zone modules
	const total = size + quiet * 2;

	let rects = "";
	for (let r = 0; r < size; r++) {
		for (let c = 0; c < size; c++) {
			if (matrix[r]?.[c]) {
				rects += `<rect x="${c + quiet}" y="${r + quiet}" width="1" height="1"/>`;
			}
		}
	}

	return (
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges">` +
		`<rect width="${total}" height="${total}" fill="white"/>` +
		`<g fill="black">${rects}</g>` +
		`</svg>`
	);
}
