import { readFileSync } from "node:fs";

export const corpusFolioExistence = JSON.parse(
  readFileSync(new URL("../src/data/corpus-folio-existence.generated.json", import.meta.url), "utf8"),
);
