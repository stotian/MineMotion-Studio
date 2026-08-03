self.onmessage = (event) => {
  const request = event.data;
  if (request?.type !== "invoke" || request.capability !== "import.parse-text") return;
  const text = typeof request.payload?.text === "string" ? request.payload.text.slice(0, 100000) : "";
  self.postMessage({ id: request.id, ok: true, payload: { lines: text.split(/\r?\n/).length } });
};
