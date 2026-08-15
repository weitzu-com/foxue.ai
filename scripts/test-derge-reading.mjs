import assert from "node:assert/strict";
import { parseDergeSources } from "../src/lib/derge-reading.mjs";

const reading = parseDergeSources([
  {
    filename: "090.txt",
    volume: "090",
    text: "[1b]\n[1b.1]{D587}ཀ་{D588}ཁ་\n[1b.2]ག་\n[1b.2]ང་\n",
  },
].map((source) => ({ ...source, text: source.text.slice(source.text.indexOf("{D588}")), initialPage: "1b", initialLine: "1" })), { canonId: "D588" });

assert.deepEqual(reading.segments, [
  {
    id: "D588.090.0001b01.01",
    text: "ཁ་",
    juan: "090",
    page: "0001b",
    sourcePage: "1b",
    sourceLine: "1",
  },
  {
    id: "D588.090.0001b02.01",
    text: "ག་",
    juan: "090",
    page: "0001b",
    sourcePage: "1b",
    sourceLine: "2",
  },
  {
    id: "D588.090.0001b02.02",
    text: "ང་",
    juan: "090",
    page: "0001b",
    sourcePage: "1b",
    sourceLine: "2",
  },
]);
assert.deepEqual(reading.navigation, [{
  key: "090-0001b",
  id: "D588.090.0001b01.01",
  label: "1b",
  juan: "090",
  sourcePage: "0001b",
}]);

assert.throws(
  () => parseDergeSources([{ filename: "001.txt", text: "正文" }], { canonId: "D1" }),
  /缺少可继承的版页行号/,
);

console.log("德格甘珠尔解析器测试通过：共享物理行与重复行号均生成唯一稳定锚点。");
