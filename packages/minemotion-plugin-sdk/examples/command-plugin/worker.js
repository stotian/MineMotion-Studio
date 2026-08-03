self.onmessage = (event) => {
  const request = event.data;
  if (request?.type !== "invoke" || request.capability !== "analysis.shot-summary") return;
  const shots = Array.isArray(request.payload?.shots) ? request.payload.shots : [];
  self.postMessage({ id: request.id, ok: true, payload: { total: shots.length, ready: shots.filter((shot) => shot.status === "ready").length } });
};
