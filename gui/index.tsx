import { render } from "preact";
import Dash from "./dash.tsx";
import Login from "./login.tsx";
import { clientServerSocket } from "./websocket.ts";

function App() {
	if (clientServerSocket.initializing.value) {
		return <h1>Loading...</h1>;
	}
	if (clientServerSocket.username.value === null) {
		return <Login />;
	}
	return <Dash />;
}

render(<App />, document.querySelector("#app") ?? document.body);
