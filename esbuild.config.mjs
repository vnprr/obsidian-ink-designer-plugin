import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";
import { readFileSync, writeFileSync, existsSync } from "fs";

const prod = process.argv[2] === "production";

// Merge xyflow CSS + custom CSS into styles.css (loaded by Obsidian)
function mergeCSS() {
  let css = readFileSync("node_modules/@xyflow/react/dist/style.css", "utf8");
  if (existsSync("src/styles.css")) {
    css += "\n\n" + readFileSync("src/styles.css", "utf8");
  }
  writeFileSync("styles.css", css);
}

const context = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: [
    "obsidian",
    "electron",
    "@codemirror/autocomplete",
    "@codemirror/collab",
    "@codemirror/commands",
    "@codemirror/language",
    "@codemirror/lint",
    "@codemirror/search",
    "@codemirror/state",
    "@codemirror/view",
    "@lezer/common",
    "@lezer/highlight",
    "@lezer/lr",
    ...builtins,
  ],
  format: "cjs",
  target: "es2018",
  logLevel: "info",
  sourcemap: prod ? false : "inline",
  treeShaking: true,
  outfile: "main.js",
});

mergeCSS();

if (prod) {
  await context.rebuild();
  process.exit(0);
} else {
  await context.watch();
}
