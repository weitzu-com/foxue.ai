import {
  folioExistencePackJuanStride,
  folioExistencePackPageStride,
  folioExistencePackedKeyPattern,
  folioExistenceSchema,
} from "./corpus-folio-existence-paths.mjs";

export { folioExistenceMaxBytes, folioExistenceSchema } from "./corpus-folio-existence-paths.mjs";

const decodedTables = new WeakMap();

export function packFolioKey(key) {
  const match = folioExistencePackedKeyPattern.exec(key);
  if (!match) return null;
  const column = match[3].charCodeAt(0) - 97;
  if (column < 0 || column > 25) return null;
  return Number(match[1]) * folioExistencePackJuanStride
    + Number(match[2]) * folioExistencePackPageStride
    + column;
}

function encodeVarint(value) {
  const bytes = [];
  let remaining = value;
  while (remaining > 0x7f) {
    bytes.push((remaining & 0x7f) | 0x80);
    remaining = Math.floor(remaining / 128);
  }
  bytes.push(remaining);
  return bytes;
}

function decodeVarint(bytes, offset) {
  let value = 0;
  let shift = 1;
  while (offset < bytes.length) {
    const byte = bytes[offset];
    offset += 1;
    value += (byte & 0x7f) * shift;
    if ((byte & 0x80) === 0) return { value, offset };
    shift *= 128;
  }
  throw new Error("版页存在账本 varint 被截断");
}

function encodeBase64(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function decodeBase64(text) {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export function encodePackedValues(values) {
  const unique = [...new Set(values)].sort((left, right) => left - right);
  const bytes = [];
  let previous = 0;
  for (const value of unique) {
    bytes.push(...encodeVarint(value - previous));
    previous = value;
  }
  return encodeBase64(Uint8Array.from(bytes));
}

function decodePackedValues(payload) {
  const bytes = decodeBase64(payload);
  const values = [];
  let offset = 0;
  let previous = 0;
  while (offset < bytes.length) {
    const decoded = decodeVarint(bytes, offset);
    previous += decoded.value;
    values.push(previous);
    offset = decoded.offset;
  }
  return Uint32Array.from(values);
}

function binarySearchUint32(values, target) {
  let low = 0;
  let high = values.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    const value = values[mid];
    if (value === target) return true;
    if (value < target) low = mid + 1;
    else high = mid - 1;
  }
  return false;
}

function asExistenceDocument(value) {
  if (!value || typeof value !== "object") return null;
  const document = value;
  if (document.schema !== folioExistenceSchema) return null;
  if (!Array.isArray(document.packedSlugs) || !Array.isArray(document.packed)) return null;
  if (!Array.isArray(document.looseSlugs) || !Array.isArray(document.looseKeys)) return null;
  if (document.packedSlugs.length !== document.packed.length) return null;
  if (document.looseSlugs.length !== document.looseKeys.length) return null;
  return document;
}

export function getFolioExistenceTable(existence) {
  const cached = decodedTables.get(existence);
  if (cached) return cached;
  const document = asExistenceDocument(existence);
  if (!document) throw new Error("版页存在账本 schema 不正确");
  const table = new Map();
  for (const [index, slug] of document.packedSlugs.entries()) {
    table.set(slug, { packed: decodePackedValues(document.packed[index]) });
  }
  for (const [index, slug] of document.looseSlugs.entries()) {
    const keys = document.looseKeys[index];
    if (!Array.isArray(keys)) throw new Error(`${slug} 的存在账本键列表损坏`);
    table.set(slug, { keys: new Set(keys) });
  }
  decodedTables.set(existence, table);
  return table;
}

export function catalogFolioKeyExists(existence, slug, key) {
  const entry = getFolioExistenceTable(existence).get(slug);
  if (!entry) return false;
  if (entry.packed) {
    const packed = packFolioKey(key);
    if (packed === null) return false;
    return binarySearchUint32(entry.packed, packed);
  }
  return entry.keys.has(key);
}
