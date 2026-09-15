import assert from "node:assert/strict";
import {
  buildCorpusSearchGrams,
  corpusSearchDocumentShardId,
  corpusSearchDocumentShardLabel,
  corpusSearchLanguageCode,
  corpusSearchShardId,
  corpusSearchShardLabel,
  decodeCorpusSearchPostings,
  intersectCorpusSearchPostings,
  normalizeCorpusSearchText,
  selectCorpusSearchQueryGrams,
} from "../src/lib/corpus-search-contract.mjs";

function encodePostingList(documentIds) {
  const bytes = [];
  let previous = 0;
  for (const documentId of documentIds) {
    let value = documentId - previous;
    previous = documentId;
    do {
      let byte = value & 0x7f;
      value >>>= 7;
      if (value > 0) byte |= 0x80;
      bytes.push(byte);
    } while (value > 0);
  }
  return Uint8Array.from(bytes);
}

assert.equal(normalizeCorpusSearchText(" 應 無所住，而生其心。\n"), "應無所住而生其心");
assert.equal(normalizeCorpusSearchText("ＡＢＣ Buddha"), "abcbuddha");
assert.deepEqual(buildCorpusSearchGrams("如是我聞"), ["如是我", "是我聞"]);
assert.deepEqual(buildCorpusSearchGrams("aaaa"), ["aaa"]);
assert.deepEqual(
  decodeCorpusSearchPostings(encodePostingList([0, 1, 127, 128, 300, 265_252])),
  [0, 1, 127, 128, 300, 265_252],
);
assert.deepEqual(
  intersectCorpusSearchPostings([[1, 2, 4, 9], [0, 2, 4, 8], [2, 3, 4]]),
  [2, 4],
);
assert.equal(selectCorpusSearchQueryGrams("一二三四五六七八九十甲乙丙丁").length, 8);
assert.equal(corpusSearchShardLabel(corpusSearchShardId("應無所" )).length, 3);
assert.equal(corpusSearchDocumentShardId(1_024), 2);
assert.equal(corpusSearchDocumentShardLabel(2), "0002");
assert.equal(corpusSearchLanguageCode("古漢語（繁體）"), "zh");
assert.equal(corpusSearchLanguageCode("藏文（德格版）"), "bo");
assert.equal(corpusSearchLanguageCode("Pāli"), "pi");
assert.equal(corpusSearchLanguageCode("English translation"), "en");
assert.equal(corpusSearchLanguageCode("梵文"), "indic");

console.log("✓ 全文检索归一化、分片、倒排表与语言契约验证通过");
