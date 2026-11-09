// gtag.js only executes dataLayer commands that are an `arguments` object.
// A rest-parameter array is ignored (see Mb()/NE() in the gtag runtime), so
// consent, config, and page_view never leave the browser.
const executableCommands = new Set([
  "config",
  "consent",
  "event",
  "get",
  "js",
  "set",
]);

export function enqueueGtagCommand(dataLayer: unknown[], command: IArguments) {
  dataLayer.push(command);
}

export function isExecutableGtagCommand(entry: unknown) {
  if (entry == null || typeof entry !== "object") return false;
  const isArgumentsObject = Object.prototype.toString.call(entry) === "[object Arguments]"
    || Object.prototype.hasOwnProperty.call(entry, "callee");
  if (!isArgumentsObject) return false;
  const name = (entry as { 0?: unknown })[0];
  return typeof name === "string" && executableCommands.has(name);
}
