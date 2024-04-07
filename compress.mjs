import { promises as fs } from 'fs';
import zlib from 'zlib';
import { promisify } from 'util';
import { iterate } from 'glob';

const formats = [{
	extension: '.gz',
	compress: promisify(zlib.gzip),
	options: {
		level: zlib.constants.Z_BEST_COMPRESSION
	}
}, {
	extension: '.br',
	compress: promisify(zlib.brotliCompress),
	options: {
		params: {
			[zlib.constants.BROTLI_PARAM_QUALITY]: zlib.constants.BROTLI_MAX_QUALITY
		}
	}
}];

let totalSize = 0;
const compressedSizes = {};

console.log('compressing static files...')

for await (const file of iterate('.next/static/{chunks,css}/**/*.{js,css}')) {
	const data = await fs.readFile(file);
	totalSize += data.length;
	for (const format of formats) {
		const compressed = await format.compress(data, format.options);
		compressedSizes[format.extension] = (compressedSizes[format.extension] ?? 0) + compressed.length;
		await fs.writeFile(`${file}${format.extension}`, compressed);
	}
}

Object.entries(compressedSizes).forEach(([ext, size]) =>
	console.log(`  ${ext.slice(1)}: ${((1 - size / totalSize) * 100).toFixed(1)}% reduction (${Math.floor(totalSize / 1000)}kB -> ${Math.floor(size / 1000)}kB)`))
