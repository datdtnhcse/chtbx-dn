import { render } from "preact";
import { setup } from "twind";
import config from "../twind.config.ts";
import Dash from "./dash.tsx";
import Login from "./login.tsx";
import { initializing, state } from "./state.ts";

setup(config);

function App() {
	if (initializing.value) {
		return <h1>Loading...</h1>;
	}
	if (state.username.value === null) {
		return <Login />;
	}
	return <Dash />;
}

render(<App />, document.querySelector("#app") ?? document.body);
