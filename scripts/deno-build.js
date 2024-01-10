import { bundle } from "https://deno.land/x/emit/mod.ts";

var { code } = await bundle("./src/index.ts");
Deno.writeTextFileSync("bin/jsencrypt.bundle.js", code);