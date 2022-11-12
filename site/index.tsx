import { render } from "preact";
import Login from "./login.tsx";
import { initializing } from "./state.ts";

function App() {
	if (initializing.value) {
		return <h1>Loading...</h1>;
	}
	return <Login />;
}

render(<App />, document.querySelector("#app") ?? document.body);
