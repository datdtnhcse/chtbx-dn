import { useSignal, useSignalEffect } from "@preact/signals";
import { ActionType } from "../protocol/action_result.ts";
import { FriendStatus } from "../protocol/request_response.ts";
import { state, wsC2SConnection, wsP2PConnections } from "./state.ts";

export default function Dash() {
	useSignalEffect(() => {
		wsC2SConnection.send({ type: ActionType.SYNC });
	});

	return (
		<ul>
			{state.friends.value.map((friend) => {
				const status = (friend.state.type ? "Online" : "Offline");
				const message = useSignal("");

				if (
					!wsP2PConnections.get(friend.username) &&
					friend.state.type === FriendStatus.ONLINE
				) {
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
								state.dialogs.value.get(friend.username)!.map(
									(item) => {
										return (
											<div>
												<b>{item}</b>
											</div>
										);
									},
								)
							}
						</ul>
						<p></p>

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
									state.dialogs.value.get(friend.username)!
										.push("me:" + message.value);
									console.log(
										"dialog",
										state.dialogs.value.get(
											friend.username,
										)!,
									);
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
