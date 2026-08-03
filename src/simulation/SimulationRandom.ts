export function createDeterministicRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function deterministicNoise(seed: number, frame: number, channel = 0): number {
  const random = createDeterministicRandom((seed ^ Math.imul(frame + 1, 0x45d9f3b) ^ Math.imul(channel + 1, 0x27d4eb2d)) >>> 0);
  return random() * 2 - 1;
}
