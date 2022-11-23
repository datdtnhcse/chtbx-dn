import { useSignal, useSignalEffect } from "@preact/signals";
import { ActionType } from "../protocol/action_result.ts";
import { FriendStatus } from "../protocol/request_response.ts";
import { dialogs, state, wsC2SConnection, wsP2PConnections } from "./state.ts";

export default function Dash() {
	useSignalEffect(() => {
		wsC2SConnection.send({ type: ActionType.SYNC });
	});

	return (
		<ul>
			{state.friends.value.map((friend) => {
				const status = (friend.state.type ? "Online" : "Offline");
				const message = useSignal("");
				let dialog: string[] = [];

				if (friend.state.type === FriendStatus.ONLINE) {
					wsC2SConnection.send({
						type: ActionType.CONNECT,
						username: friend.username,
					});
				}

				return (
					<div>
						<ul>
							{
								/* run fail. I want show dialog. Can help ?*/
								dialog.map((item) => {
									return (
										<div>
											<b>{item}</b>
										</div>
									);
								})
							}
						</ul>
						<p></p>
						<button
							onClick={() => {
								dialog = dialogs.get(friend.username)!;
								console.log(dialog);
							}}
						>
							dialog
						</button>

						<button
							onClick={() => {
								const send = document.getElementById("myForm")!;
								if (send.style.display === "none") {
									send.style.display = "block";
								} else {
									send.style.display = "none";
								}
							}}
						>
							{friend.username}
						</button>{" "}
						<b>{status}</b>
						<div></div>
						<div
							class="chat-popup"
							id="myForm"
							style="display: none"
						>
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
									wsP2PConnections.get(friend.username)!.send(
										{
											type: ActionType.SEND_MESSAGE,
											content: message.value,
										},
									);
									dialog = (dialogs.get(friend.username)
										? dialogs.get(friend.username)
										: [])!;
									dialog.push("me:" + message.value);
									console.log("dialog", dialog);
								}}
							>
								Send
							</button>
						</div>
					</div>
				);
			})}
		</ul>
	);
}
