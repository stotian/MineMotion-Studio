/// <reference types="vite/client" />
import ts from "typescript";
import { describe, expect, it } from "vitest";

const SOURCE_MODULES = import.meta.glob<string>(
  ["../App.tsx", "../commands/CommandPalette.tsx", "../animation/editor/*.tsx", "../export/renderQueue/*.tsx", "../renderer/Viewport.tsx", "../ui/**/*.tsx"],
  { query: "?raw", import: "default", eager: true }
);

const TECHNICAL_TEXT = new Set([
  "FX",
  "MineMotion Studio",
  "NLA",
  "FPS",
  "PNG Frame",
  "PNG ZIP",
  "WebM",
  "WAV",
  "720p",
  "1080p",
  "1440p",
  "4K",
  "×",
  "f",
  "- v",
  "x",
  "0.5x",
  "2x",
  "FX -",
  "FX +",
  "bytes /",
  "level.dat",
  "ffmpeg or C:\\ffmpeg\\bin\\ffmpeg.exe",
  "C:\\Users\\you\\Videos"
]);

function location(source: ts.SourceFile, node: ts.Node): string {
  const start = source.getLineAndCharacterOfPosition(node.getStart(source));
  return `${source.fileName}:${start.line + 1}`;
}

describe("localization source guard", () => {
  it("rejects major raw JSX labels and untranslated dialog prompts", () => {
    const violations: string[] = [];
    for (const [sourcePath, sourceText] of Object.entries(SOURCE_MODULES)) {
      const source = ts.createSourceFile(
        sourcePath,
        sourceText,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
      );
      const visit = (node: ts.Node) => {
        if (ts.isJsxText(node)) {
          const value = node.getText(source).replace(/\s+/g, " ").trim();
          if (/[A-Za-zÀ-ÿ]/.test(value) && !TECHNICAL_TEXT.has(value)) {
            violations.push(`${location(source, node)} raw JSX text: ${value}`);
          }
        }
        if (
          ts.isJsxAttribute(node) &&
          ["aria-label", "title", "placeholder", "label"].includes(node.name.getText(source)) &&
          node.initializer &&
          ts.isStringLiteral(node.initializer) &&
          /[A-Za-zÀ-ÿ]/.test(node.initializer.text) &&
          !TECHNICAL_TEXT.has(node.initializer.text) &&
          !(node.name.getText(source) === "placeholder" && node.initializer.text.includes("\\"))
        ) {
          violations.push(`${location(source, node)} raw ${node.name.getText(source)}: ${node.initializer.text}`);
        }
        if (
          ts.isCallExpression(node) &&
          ts.isPropertyAccessExpression(node.expression) &&
          node.expression.expression.getText(source) === "window" &&
          ["alert", "confirm", "prompt"].includes(node.expression.name.text) &&
          node.arguments.some((argument) => ts.isStringLiteral(argument))
        ) {
          violations.push(`${location(source, node)} untranslated browser dialog`);
        }
        ts.forEachChild(node, visit);
      };
      visit(source);
    }
    expect(violations).toEqual([]);
  });
});
