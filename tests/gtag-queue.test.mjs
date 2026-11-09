import assert from "node:assert/strict";
import test from "node:test";
import { enqueueGtagCommand, isExecutableGtagCommand } from "../src/lib/gtag-queue.ts";

test("gtag.js only accepts arguments objects, so queued arrays cannot become hits", () => {
  const dataLayer = [];

  function queueGtag() {
    enqueueGtagCommand(dataLayer, arguments);
  }

  queueGtag("consent", "default", { analytics_storage: "denied" });
  queueGtag("consent", "update", { analytics_storage: "granted" });
  queueGtag("js", new Date());
  queueGtag("config", "G-FOXUETEST", { send_page_view: false });
  queueGtag("event", "page_view", {
    page_path: "/",
    page_location: "https://www.foxue.ai/?utm_source=newsletter",
  });
  queueGtag("event", "question_started", {
    entry_point: "home",
    example_used: false,
    input_length: 4,
    mode: "meaning",
  });

  assert.equal(dataLayer.length, 6);
  assert.equal(dataLayer.filter((entry) => isExecutableGtagCommand(entry)).length, 6);

  const pageViews = dataLayer.filter((entry) => (
    isExecutableGtagCommand(entry) && entry[1] === "page_view"
  ));
  assert.equal(pageViews.length, 1);
  assert.equal(pageViews[0][2]?.page_path, "/");

  dataLayer.push(["event", "page_view", { page_path: "/counted-if-arrays-worked" }]);
  assert.equal(isExecutableGtagCommand(dataLayer.at(-1)), false);
  assert.equal(dataLayer.filter((entry) => (
    isExecutableGtagCommand(entry) && entry[1] === "page_view"
  )).length, 1);

  const serialized = JSON.stringify(dataLayer.map((entry) => Array.from(entry)));
  assert.equal(serialized.includes("私人问题"), false);
  assert.equal(serialized.includes("question text"), false);
});
