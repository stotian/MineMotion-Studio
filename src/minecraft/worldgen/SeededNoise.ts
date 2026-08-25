/**
 * Deterministic value noise for world generation.
 *
 * Not Minecraft's generator: reproducing Mojang's terrain exactly would need
 * their density functions, and those change between versions. This produces
 * Minecraft-LIKE terrain from a seed — the same seed always yields the same
 * world here, but it will not match what the game generates for that seed.
 */

/** Mixes a 32-bit integer so nearby inputs give unrelated outputs. */
function hash32(value: number): number {
  let x = value | 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  return (x ^ (x >>> 16)) >>> 0;
}

/** Hashes a 2D lattice point with the seed, to [0, 1). */
function hash2(seed: number, x: number, z: number): number {
  return hash32(hash32(x * 374761393 + z * 668265263) ^ seed) / 0x100000000;
}

/** Hashes a 3D lattice point with the seed, to [0, 1). */
function hash3(seed: number, x: number, y: number, z: number): number {
  return hash32(hash32(x * 374761393 + y * 1274126177 + z * 668265263) ^ seed) / 0x100000000;
}

/** Smoothstep, so interpolated noise has no visible lattice creases. */
function fade(t: number): number {
  return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Bilinear value noise in [0, 1). */
export function noise2(seed: number, x: number, z: number): number {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const tx = fade(x - x0);
  const tz = fade(z - z0);
  const n00 = hash2(seed, x0, z0);
  const n10 = hash2(seed, x0 + 1, z0);
  const n01 = hash2(seed, x0, z0 + 1);
  const n11 = hash2(seed, x0 + 1, z0 + 1);
  return lerp(lerp(n00, n10, tx), lerp(n01, n11, tx), tz);
}

/** Trilinear value noise in [0, 1), used for caves. */
export function noise3(seed: number, x: number, y: number, z: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const z0 = Math.floor(z);
  const tx = fade(x - x0);
  const ty = fade(y - y0);
  const tz = fade(z - z0);
  const c000 = hash3(seed, x0, y0, z0);
  const c100 = hash3(seed, x0 + 1, y0, z0);
  const c010 = hash3(seed, x0, y0 + 1, z0);
  const c110 = hash3(seed, x0 + 1, y0 + 1, z0);
  const c001 = hash3(seed, x0, y0, z0 + 1);
  const c101 = hash3(seed, x0 + 1, y0, z0 + 1);
  const c011 = hash3(seed, x0, y0 + 1, z0 + 1);
  const c111 = hash3(seed, x0 + 1, y0 + 1, z0 + 1);
  return lerp(
    lerp(lerp(c000, c100, tx), lerp(c010, c110, tx), ty),
    lerp(lerp(c001, c101, tx), lerp(c011, c111, tx), ty),
    tz
  );
}

/** Sums octaves of noise2, giving detail at several scales. */
export function fbm2(
  seed: number,
  x: number,
  z: number,
  octaves: number,
  scale: number
): number {
  let total = 0;
  let amplitude = 1;
  let frequency = 1 / scale;
  let normalization = 0;
  for (let octave = 0; octave < octaves; octave += 1) {
    total += noise2(seed + octave * 1013, x * frequency, z * frequency) * amplitude;
    normalization += amplitude;
    amplitude *= 0.5;
    frequency *= 2;
  }
  return total / normalization;
}

/** Turns an arbitrary seed string into the 32-bit integer the noise uses. */
export function parseSeed(seed: string): number {
  const trimmed = seed.trim();
  if (/^-?\d+$/.test(trimmed)) {
    // Numeric seeds are used directly, as Minecraft does.
    return Number(trimmed) | 0;
  }
  let hash = 0;
  for (let index = 0; index < trimmed.length; index += 1) {
    hash = (Math.imul(hash, 31) + trimmed.charCodeAt(index)) | 0;
  }
  return hash;
}
