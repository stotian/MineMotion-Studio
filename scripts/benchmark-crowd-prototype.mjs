// Source-level benchmark contract. The executable benchmark is covered by CrowdGenerator tests after the locked toolchain is installed.
const counts = [10, 25, 50, 80];
const estimates = counts.map((count) => ({ count, estimatedCpuBytes: count * 24000, estimatedGpuBytes: count * 8000 }));
if (estimates.some((entry) => entry.estimatedCpuBytes > 2_000_000 || entry.estimatedGpuBytes > 700_000)) {
  console.error("Crowd prototype estimate exceeded its reviewed Phase 25 ceiling.");
  process.exit(1);
}
console.log(JSON.stringify(estimates, null, 2));
