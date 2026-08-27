export interface OfflineLeaseClockState {
  lastTrustedAt: string | null;
}

export type OfflineLeaseClockResult =
  | { allowed: true; next: OfflineLeaseClockState }
  | { allowed: false; reason: "CLOCK_ROLLBACK" | "LEASE_EXPIRED"; next: OfflineLeaseClockState };

/** Detects obvious clock rollback without collecting hardware identifiers. */
export function evaluateOfflineLeaseClock(
  state: OfflineLeaseClockState,
  now: Date,
  leaseExpiresAt: string,
  toleranceMs = 5 * 60 * 1000
): OfflineLeaseClockResult {
  const previous = state.lastTrustedAt === null ? null : Date.parse(state.lastTrustedAt);
  const expiresAt = Date.parse(leaseExpiresAt);
  if (!Number.isFinite(expiresAt) || now.getTime() > expiresAt) return { allowed: false, reason: "LEASE_EXPIRED", next: state };
  if (previous !== null && Number.isFinite(previous) && now.getTime() + toleranceMs < previous) {
    return { allowed: false, reason: "CLOCK_ROLLBACK", next: state };
  }
  return { allowed: true, next: { lastTrustedAt: now.toISOString() } };
}
