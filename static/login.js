// @ts-check

import { html } from "./utils.js";
import { send } from "./websocket.js";

export default function Login() {
	/** @param {SubmitEvent} e */
	const onSubmit = async (e) => {
		e.preventDefault();
		// @ts-ignore: e.target is always the form
		const data = new FormData(e.target);
		const res = await send({
			type: "login",
			username: data.get("username")?.toString() ?? "",
			password: data.get("password")?.toString() ?? "",
		});
		console.log(res);
	};

	return html`<form onSubmit=${onSubmit}>
		<label>
			Username:
			<input type="text" name="username" />
		</label>
		<label>
			Password:
			<input type="password" name="password" />
		</label>
		<button>Ok</button>
	</form>`;
}
