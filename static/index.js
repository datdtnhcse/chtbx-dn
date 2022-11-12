// @ts-check

import { render } from "preact";
import Login from "./login.js";
import { html } from "./utils.js";

function App() {
	return html`<${Login} />`;
}

render(html`<${App} />`, document.body);
