const ACCENTS: Readonly<Record<string, string>> = Object.freeze({
  a: "à", b: "ƀ", c: "ç", d: "ď", e: "ë", f: "ƒ", g: "ğ", h: "ħ",
  i: "ï", j: "ĵ", k: "ķ", l: "ľ", m: "ɱ", n: "ñ", o: "ô", p: "þ",
  q: "ɋ", r: "ř", s: "š", t: "ŧ", u: "ü", v: "ṽ", w: "ŵ", x: "ẋ",
  y: "ÿ", z: "ž"
});

export function pseudolocalize(value: string): string {
  let result = "";
  let placeholderDepth = 0;
  for (const character of value) {
    if (character === "{") placeholderDepth += 1;
    const lower = character.toLowerCase();
    const replacement = placeholderDepth === 0 ? ACCENTS[lower] : undefined;
    result += replacement
      ? character === lower ? replacement : replacement.toUpperCase()
      : character;
    if (character === "}") placeholderDepth = Math.max(0, placeholderDepth - 1);
  }
  return `⟦${result} ···⟧`;
}
