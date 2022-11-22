import { useSignal, useSignalEffect } from "@preact/signals";
import { ActionType } from "../protocol/action_result.ts";
import { FriendStatus } from "../protocol/request_response.ts";
import { state, wsC2SConnection, wsP2PConnections } from "./state.ts";

export default function Dash() {
	const message = useSignal("");

	// friendConnections.on({
	// 	type: ActionType.SEND_MESSAGE,
	// 	mess: message.value,
	// }}
	useSignalEffect(() => {
		wsC2SConnection.send({ type: ActionType.SYNC });
	});

	return (
		<ul>
			{state.friends.value.map((friend) => (
				<div>
					<button
						onClick={() => {
							const send = document.getElementById("myForm")!;
							if (
								send.style.display === "none" &&
								friend.state.type == FriendStatus.ONLINE
							) {
								send.style.display = "block";
							} else if (
								friend.state.type == FriendStatus.OFFLINE
							) {
								send.style.display = "none";
							}

							wsC2SConnection.send({
								type: ActionType.CONNECT,
								username: friend.username,
							});
						}}
					>
						{friend.username}
					</button>{" "}
					<b>{friend.state.type}</b>
					<div></div>
					<div class="chat-popup" id="myForm" style="display: none">
						<label>
							<input
								type="message"
								value={message}
								onInput={(e) =>
									message.value = e.currentTarget.value}
							/>
						</label>
						<button
							onClick={() => {
								console.log("ab", friend.username);
								wsP2PConnections.get(friend.username)!.send({
									type: ActionType.SEND_MESSAGE,
									mess: message.value,
								});
								console.log("cd");
							}}
						>
							Send
						</button>
					</div>
				</div>
			))}
		</ul>
	);
}
