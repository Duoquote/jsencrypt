import { bundle } from "https://deno.land/x/emit/mod.ts";
const { code } = await bundle("./src/index.ts");

Deno.writeTextFileSync("bin/jsencrypt.bundle.js", code);