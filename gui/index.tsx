import { render } from "preact";
import Dash from "./dash.tsx";
import Login from "./login.tsx";
import Register from "./register.tsx";
import { initializing, username } from "./state.ts";


function App() {
	if (initializing.value) {
		return <h1>Loading...</h1>;
	}
	if (username.value === null) {
		return <Login />;
	}
	return <Dash />;
}

render(<App />, document.querySelector("#app") ?? document.body);
