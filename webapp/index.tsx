import { render } from "preact";
import Dash from "./dash.tsx";
import Login from "./login.tsx";
import { initializing, state } from "./state.ts";

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
