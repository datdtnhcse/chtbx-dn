import { useSignalEffect } from "@preact/signals";
import { ActionType } from "../protocol/action_result.ts";
import { clientConnection, state } from "./state.ts";

export default function Dash() {
	useSignalEffect(() => {
		clientConnection.act({ type: ActionType.SYNC });
	});
	return (
		<ul>
			{state.friends.value.map((friend) => (
				<button
					onClick={() =>
						clientConnection.act({
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
