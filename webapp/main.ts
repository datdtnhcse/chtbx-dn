import * as esbuild from "https://deno.land/x/esbuild@v0.15.13/mod.js";
import * as importMap from "https://esm.sh/esbuild-plugin-import-map@2.1.0";
import { WEBAPP_PORT, SUBWEBSOCKET_PORT, WEBSOCKET_PORT } from "../env.ts";

await importMap.load(["./import_map.json"]);
await esbuild.serve({
	port: WEBAPP_PORT,
	servedir: "webapp",
}, {
	entryPoints: ["./webapp/index.tsx"],
	bundle: true,
	treeShaking: true,
	sourcemap: true,
	format: "esm",
	jsx: "automatic",
	jsxImportSource: "preact",
	plugins: [importMap.plugin()],
	define: {
		"window.WEBSOCKET_PORT": `${WEBSOCKET_PORT}`,
		"window.SUBWEBSOCKET_PORT": `${SUBWEBSOCKET_PORT}`,
	},
});
