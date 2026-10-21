import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';
import { resolve, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const crcTable = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/** Validate actual PNG bytes, not just a filename or HTTP content type. */
export function checkMapAssets(root = projectRoot) {
  const manifest = JSON.parse(readFileSync(join(root, 'public/maps/v6/map-manifest.json'), 'utf8'));
  const expected = manifest.ocean;
  if (expected.file !== '/marketverse-ocean.png') throw new Error('Unexpected ocean asset path');
  const bytes = readFileSync(join(root, 'public', expected.file.slice(1)));
  if (!bytes.subarray(0, 8).equals(signature)) throw new Error('Ocean asset is not a PNG image');
  const compressed = [];
  let header;
  let ended = false;
  for (let offset = 8; offset < bytes.length; ) {
    if (offset + 12 > bytes.length) throw new Error('Ocean PNG is truncated');
    const length = bytes.readUInt32BE(offset);
    const end = offset + 12 + length;
    if (end > bytes.length) throw new Error('Ocean PNG chunk is truncated');
    const type = bytes.toString('ascii', offset + 4, offset + 8);
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    if (crc32(bytes.subarray(offset + 4, end - 4)) !== bytes.readUInt32BE(end - 4))
      throw new Error('Ocean PNG has a corrupt chunk');
    if (!header && type !== 'IHDR') throw new Error('Ocean PNG has no image header');
    if (type === 'IHDR') {
      if (header || length !== 13) throw new Error('Ocean PNG has an invalid image header');
      header = {
        width: data.readUInt32BE(0),
        height: data.readUInt32BE(4),
        channels: data[9] === 2 ? 3 : data[9] === 6 ? 4 : 0,
      };
      if (
        header.width !== expected.width ||
        header.height !== expected.height ||
        header.width !== 1536 ||
        header.height !== 1024
      )
        throw new Error('Ocean PNG dimensions do not match the artwork contract');
      if (data[8] !== 8 || !header.channels || data[10] || data[11] || data[12])
        throw new Error('Ocean PNG must be an 8-bit RGB/RGBA non-interlaced image');
    }
    if (type === 'IDAT') compressed.push(data);
    if (type === 'IEND') {
      if (length || end !== bytes.length) throw new Error('Ocean PNG has an invalid ending');
      ended = true;
    }
    offset = end;
  }
  if (!header || !compressed.length || !ended) throw new Error('Ocean PNG is incomplete');
  const expectedLength = (1 + header.width * header.channels) * header.height;
  const decoded = inflateSync(Buffer.concat(compressed), { maxOutputLength: expectedLength });
  if (decoded.length !== expectedLength) throw new Error('Ocean PNG pixel data is incomplete');
  const stride = 1 + header.width * header.channels;
  for (let row = 0; row < header.height; row++)
    if (decoded[row * stride] > 4) throw new Error('Ocean PNG has an invalid row filter');
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  if (bytes.length !== expected.sizeBytes || sha256 !== expected.sha256)
    throw new Error('Ocean PNG does not match the approved artwork checksum');
  return { width: header.width, height: header.height, bytes: bytes.length, sha256 };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const result = checkMapAssets(process.argv[2]);
    console.log(
      `PASS: ocean artwork ${result.width}×${result.height}, ${result.bytes} bytes, SHA-256 ${result.sha256}`,
    );
  } catch (error) {
    console.error(`Map asset check failed: ${error.message}`);
    process.exitCode = 1;
  }
}
