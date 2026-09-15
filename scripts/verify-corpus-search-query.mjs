import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  corpusSearchDocumentShardId,
  corpusSearchDocumentShardLabel,
  corpusSearchShardId,
  corpusSearchShardLabel,
  decodeCorpusSearchPostings,
  intersectCorpusSearchPostings,
  normalizeCorpusSearchText,
  selectCorpusSearchQueryGrams,
} from "../src/lib/corpus-search-contract.mjs";

const artifactRoot = process.argv[2];
const query = process.argv[3];
const expectedTitle = process.argv[4];
if (!artifactRoot || !query) {
  throw new Error("用法：node scripts/verify-corpus-search-query.mjs <search-artifact-root> <query> [expected-title]");
}

async function json(relativePath) {
  return JSON.parse(await readFile(resolve(artifactRoot, relativePath), "utf8"));
}

const pointer = await json("v1/search/latest.json");
const manifest = await json(pointer.manifestObjectKey);
const prefix = `v1/search/releases/${pointer.searchReleaseId}`;
const normalized = normalizeCorpusSearchText(query);
const grams = selectCorpusSearchQueryGrams(normalized);
const postingLists = await Promise.all(grams.map(async (gram) => {
  const shard = corpusSearchShardLabel(corpusSearchShardId(gram));
  const document = await json(`${prefix}/grams/${shard}.json`);
  const encoded = document.grams[gram];
  return encoded
    ? decodeCorpusSearchPostings(Buffer.from(encoded, "base64"))
    : [];
}));
const candidateIds = intersectCorpusSearchPostings(postingLists);
const inspectedIds = candidateIds.slice(0, 200);
const shardIds = [...new Set(inspectedIds.map(corpusSearchDocumentShardId))];
const documents = (await Promise.all(shardIds.map(async (shardId) =>
  (await json(`${prefix}/documents/${corpusSearchDocumentShardLabel(shardId)}.json`)).documents
))).flat().filter((document) => inspectedIds.includes(document.id));

assert.ok(candidateIds.length > 0, `“${query}”没有产生候选版页`);
if (expectedTitle) {
  assert.ok(
    documents.some((document) => document.title.includes(expectedTitle)),
    `前 200 个候选中未找到题名“${expectedTitle}”`,
  );
}
console.log(JSON.stringify({
  query,
  normalized,
  searchReleaseId: manifest.searchReleaseId,
  candidateDocuments: candidateIds.length,
  examples: documents.slice(0, 5).map((document) => ({
    id: document.id,
    title: document.title,
    canonRef: document.canonRef,
    expressionId: document.expressionId,
    slug: document.slug,
    folioKey: document.folioKey,
  })),
}, null, 2));
