import assert from "node:assert/strict";
import test from "node:test";
import { pinyinForBuddhistText } from "../src/lib/buddhist-pinyin.mjs";

function chinesePinyin(text) {
  return pinyinForBuddhistText(text)
    .filter((syllable) => syllable.isZh)
    .map((syllable) => syllable.result)
    .join(" ");
}

test("校正般若、三藏与舍利子的佛典读音", () => {
  assert.equal(chinesePinyin("般若波羅蜜多"), "bō rě bō luó mì duō");
  assert.equal(chinesePinyin("唐三藏法師玄奘譯"), "táng sān zàng fǎ shī xuán zàng yì");
  assert.equal(chinesePinyin("舍利子"), "shè lì zǐ");
});

test("校正心经咒语与关键多音词", () => {
  assert.equal(chinesePinyin("於是出世間"), "yú shì chū shì jiān");
  assert.equal(chinesePinyin("菩提薩埵依般若波羅蜜多故"), "pú tí sà duǒ yī bō rě bō luó mì duō gù");
  assert.equal(chinesePinyin("揭帝揭帝般羅揭帝般羅僧揭帝菩提莎婆訶"), "jiē dì jiē dì bō luó jiē dì bō luó sēng jiē dì pú tí suō pó hē");
});

test("校正前十部经的高频人名与佛教读音", () => {
  assert.equal(chinesePinyin("鳩摩羅什譯"), "jiū mó luó shí yì");
  assert.equal(chinesePinyin("楞伽經"), "léng qié jīng");
  assert.equal(chinesePinyin("長者維摩詰"), "zhǎng zhě wéi mó jié");
});

test("注音不会改写经文字符和标点", () => {
  const source = "色即是空；受、想、行、識。";
  assert.equal(pinyinForBuddhistText(source).map((syllable) => syllable.origin).join(""), source);
});
