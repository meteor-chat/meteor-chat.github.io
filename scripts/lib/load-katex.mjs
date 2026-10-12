import { readFileSync } from "node:fs";
import vm from "node:vm";

export function loadKatex(fileUrl) {
    const sandbox = {};
    sandbox.self = sandbox;
    vm.runInNewContext(readFileSync(fileUrl, "utf8"), sandbox, { filename: fileUrl.pathname });
    if (!sandbox.katex || typeof sandbox.katex.renderToString !== "function") {
        throw new Error(`KaTeX tidak bisa dimuat dari ${fileUrl.pathname}`);
    }
    return sandbox.katex;
}
