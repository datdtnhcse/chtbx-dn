import { useSignalEffect } from "@preact/signals";
import { ActionType } from "../protocol/action_result.ts";
import { state, wsC2SConnection, wsP2PConnections } from "./state.ts";

export default function Dash() {
	useSignalEffect(() => {
		wsC2SConnection.send({ type: ActionType.SYNC });
	});
	return (
		<ul>
			{state.friends.value.map((friend) => (
				<>
					<button
						onClick={() =>
							wsC2SConnection.send({
								type: ActionType.CONNECT,
								username: friend.username,
							})}
					>
						{friend.username}
					</button>
					<button
						onClick={() => {
							wsP2PConnections.get("khang")!.send({
								type: ActionType.SEND_MESSAGE,
								message: "Hola!",
							});
						}}
					>
						Hello
					</button>
				</>
			))}
		</ul>
	);
}
