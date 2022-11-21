import { useSignalEffect } from "@preact/signals";
import { ActionType } from "../protocol/action_result.ts";
import { clientConnection, state } from "./state.ts";

export default function Dash() {
	useSignalEffect(() => {
		clientConnection.send({ type: ActionType.SYNC });
	});
	return (
		<ul>
			{state.friends.value.map((friend) => (
				<button
					onClick={() =>
						clientConnection.send({
							type: ActionType.CONNECT,
							username: friend.username,
						})}
				>
					{friend.username}
				</button>
			))}
		</ul>
	);
}
