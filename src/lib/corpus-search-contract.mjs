export const corpusSearchSchema = "https://foxue.ai/schemas/corpus-search-index-v0.1";
export const corpusSearchPointerSchema = "https://foxue.ai/schemas/corpus-search-pointer-v0.1";
export const corpusSearchResultSchema = "https://foxue.ai/schemas/corpus-search-results-v0.1";
export const corpusSearchGramSize = 3;
export const corpusSearchShardCount = 1024;
export const corpusSearchDocumentShardSize = 512;
export const corpusSearchMinQueryLength = 3;
export const corpusSearchMaxQueryLength = 80;
export const corpusSearchMaxSelectedGrams = 8;

const removableSearchCharacters = /[\p{White_Space}\p{P}\p{S}\p{Cf}]/gu;

export function normalizeCorpusSearchText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase("und")
    .replace(removableSearchCharacters, "");
}

export function corpusSearchCodePoints(value) {
  return Array.from(value);
}

export function buildCorpusSearchGrams(normalizedValue) {
  const points = corpusSearchCodePoints(normalizedValue);
  if (points.length < corpusSearchGramSize) return [];
  const grams = new Set();
  for (let index = 0; index <= points.length - corpusSearchGramSize; index += 1) {
    grams.add(points.slice(index, index + corpusSearchGramSize).join(""));
  }
  return [...grams];
}

export function selectCorpusSearchQueryGrams(normalizedValue) {
  const grams = buildCorpusSearchGrams(normalizedValue);
  if (grams.length <= corpusSearchMaxSelectedGrams) return grams;

  const selected = [];
  for (let index = 0; index < corpusSearchMaxSelectedGrams; index += 1) {
    const position = Math.round(index * (grams.length - 1) / (corpusSearchMaxSelectedGrams - 1));
    selected.push(grams[position]);
  }
  return [...new Set(selected)];
}

export function corpusSearchHash(value) {
  const bytes = new TextEncoder().encode(value);
  let hash = 0x811c9dc5;
  for (const byte of bytes) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

export function corpusSearchShardId(gram) {
  return corpusSearchHash(gram) & (corpusSearchShardCount - 1);
}

export function corpusSearchShardLabel(shardId) {
  if (!Number.isInteger(shardId) || shardId < 0 || shardId >= corpusSearchShardCount) {
    throw new Error(`无效检索分片：${shardId}`);
  }
  return shardId.toString(16).padStart(3, "0");
}

export function corpusSearchDocumentShardId(documentId) {
  if (!Number.isSafeInteger(documentId) || documentId < 0) {
    throw new Error(`无效检索文档编号：${documentId}`);
  }
  return Math.floor(documentId / corpusSearchDocumentShardSize);
}

export function corpusSearchDocumentShardLabel(shardId) {
  if (!Number.isSafeInteger(shardId) || shardId < 0) {
    throw new Error(`无效文档分片：${shardId}`);
  }
  return shardId.toString().padStart(4, "0");
}

export function decodeCorpusSearchPostings(bytes) {
  const values = [];
  let previous = 0;
  let value = 0;
  let shift = 0;
  for (const byte of bytes) {
    value |= (byte & 0x7f) << shift;
    if ((byte & 0x80) === 0) {
      previous += value >>> 0;
      values.push(previous);
      value = 0;
      shift = 0;
      continue;
    }
    shift += 7;
    if (shift > 28) throw new Error("检索倒排表包含无效 varint");
  }
  if (shift !== 0) throw new Error("检索倒排表在 varint 中途结束");
  return values;
}

export function intersectCorpusSearchPostings(postingLists) {
  if (postingLists.length === 0) return [];
  const ordered = [...postingLists].sort((left, right) => left.length - right.length);
  let result = ordered[0];
  for (let listIndex = 1; listIndex < ordered.length && result.length > 0; listIndex += 1) {
    const next = ordered[listIndex];
    const intersection = [];
    let leftIndex = 0;
    let rightIndex = 0;
    while (leftIndex < result.length && rightIndex < next.length) {
      const left = result[leftIndex];
      const right = next[rightIndex];
      if (left === right) {
        intersection.push(left);
        leftIndex += 1;
        rightIndex += 1;
      } else if (left < right) {
        leftIndex += 1;
      } else {
        rightIndex += 1;
      }
    }
    result = intersection;
  }
  return result;
}

export function corpusSearchLanguageCode(language) {
  const value = String(language ?? "").toLocaleLowerCase("und");
  const asciiValue = value.normalize("NFKD").replace(/\p{M}/gu, "");
  if (/漢|汉|古漢|古汉|lzh/.test(value)) return "zh";
  if (/藏|tibt|bo-/.test(value)) return "bo";
  if (/巴利|pali|pi-/.test(asciiValue)) return "pi";
  if (/英|english|en-/.test(value)) return "en";
  if (/日|japanese|ja-/.test(value)) return "ja";
  if (/梵|sanskrit|prakrit|indic|sa-/.test(value)) return "indic";
  return "other";
}
