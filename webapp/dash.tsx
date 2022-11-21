import { useSignal, useSignalEffect } from "@preact/signals";
import { ActionType } from "../protocol/action_result.ts";
import { clientConnection, friendConnections, state } from "./state.ts";

export default function Dash() {
	const message = useSignal("");

	// friendConnections.on({
	// 	type: ActionType.SEND_MESSAGE,
	// 	mess: message.value,
	// }}
	useSignalEffect(() => {
		clientConnection.send({ type: ActionType.SYNC });
	});

	return (
		<ul>
			{state.friends.value.map((friend) => (
				<div>
					<button
						onClick={() => {
							const x = document.getElementById("myForm")!;
							if (x.style.display === "none") {
								x.style.display = "block";
							} else {
								x.style.display = "none";
							}
							clientConnection.send({
								type: ActionType.CONNECT,
								username: friend.username,
							});
						}}
					>
						{friend.username}
					</button>
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
								friendConnections.get(friend.username)!.send({
									type: ActionType.SEND_MESSAGE,
									mess: message.value,
								});
							}}
						>
							Send
						</button>
					</div>
				</div>
			))}
		</ul>
	);

	// return (
	// 	<ul>

	// 		{state.friends.value.map((friend) => (

	// 			<button
	// 				onClick={() =>
	// 					clientConnection.act({
	// 						type: ActionType.CONNECT,
	// 						username: friend.username,
	// 					})}
	// 			>
	// 				{friend.username}
	// 			</button>

	// 		))}
	// 	</ul>
	// );
}
