import * as esbuild from "https://deno.land/x/esbuild@v0.15.13/mod.js";
import * as importMap from "https://esm.sh/esbuild-plugin-import-map@2.1.0";

await importMap.load(["./import_map.json"]);

export const { port } = await esbuild.serve({
	port: parseInt(Deno.env.get("FS_PORT")!),
	servedir: "gui",
}, {
	entryPoints: ["./gui/index.tsx"],
	bundle: true,
	treeShaking: true,
	format: "esm",
	jsx: "automatic",
	jsxImportSource: "preact",
	plugins: [importMap.plugin()],
});
