import { render } from "preact";
import { setup, tw } from "twind";
import config from "../twind.config.ts";
import Dash from "./dash.tsx";
import Login from "./login.tsx";
import { initializing, state } from "./state.ts";

setup(config);

function App() {
	return (
		<div
			className={tw`relative h-screen w-full flex flex-col items-center justify-center space-y-4 font-body`}
			style={{
				backgroundImage:
					"url(https://images.unsplash.com/photo-1445387267924-a723a28a33ca)",
				backgroundSize: "cover",
			}}
		>
			{initializing.value
				? <h1>Loading...</h1>
				: state.username.value === null
				? <Login />
				: <Dash />}
		</div>
	);
}

render(<App />, document.querySelector("#app") ?? document.body);
