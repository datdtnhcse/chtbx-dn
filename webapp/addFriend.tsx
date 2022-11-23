import { useSignal } from "@preact/signals";
import { ActionType } from "../protocol/action_result.ts";
import { AddFriendStatus } from "../protocol/request_response.ts";
import { state, wsC2SConnection } from "./state.ts";

export default function AddFriend() {
	const inputUsername = useSignal("");
	const status = useSignal("");
	wsC2SConnection.on("ADD_FRIEND", (res) => {
		status.value = AddFriendStatus[res.status];
	});
	const send = () => {
		wsC2SConnection.send({
			type: ActionType.ADD_FRIEND,
			username: inputUsername.value,
		});
	};
	const sync = () => {
		wsC2SConnection.send({
			type: ActionType.SYNC,
		});
	};

	return (
		<div>
			<label>
				Username:
				<input
					type="text"
					value={inputUsername}
					onInput={(e) => inputUsername.value = e.currentTarget.value}
				/>
			</label>
			<button onClick={send}>Gửi lời mời</button>
			<button onClick={sync}>sync</button>
			<p>{status}</p>
		</div>
	);
}
