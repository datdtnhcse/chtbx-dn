import { useSignal, useSignalEffect } from "@preact/signals";
import { tw } from "twind";
import { ActionType } from "../protocol/action_result.ts";
import { AddFriendStatus, FriendStatus } from "../protocol/request_response.ts";
import { state, wsC2SConnection, wsP2PConnections } from "./state.ts";

export default function Dash() {
	useSignalEffect(() => {
		wsC2SConnection.send({ type: ActionType.SYNC });
	});

	const logout = () => {
		console.log("TODO");
	};

	return (
		<div
			className={tw`h-2/3 w-full flex items-center justify-center space-x-10`}
		>
			<div
				className={tw`w-64 h-full bg-white bg-opacity-80 p-4 rounded-md`}
				style={{
					backdropFilter: "blur(5px)",
				}}
			>
				<h1 className={tw`font-display text-6xl font-black`}>CHTBX</h1>
				<div className={tw`mt-3 flex justify-between`}>
					<p>
						hello,{" "}
						<span className={tw`font-bold`}>{state.username}</span>
					</p>
					<button
						onClick={logout}
						className={tw`text-gray-500 hover:(text-underline)`}
					>
						logout
					</button>
				</div>
				<div className={tw`mt-4 flex items-center justify-between`}>
					<h2 className={tw`font-display font-bold text-2xl`}>
						your friends
					</h2>
					<button
						className={tw`ml-2 px-2 text-yellow-600 font-bold rounded-md`}
					>
						sync
					</button>
				</div>
				<ul>
					{state.friends.value.map((friend) => {
						return <li>{friend.username}</li>;
					})}
				</ul>
				<AddFriend />
			</div>
			{[...state.dialogs.value.keys()].map((username) => {
				return <Dialog username={username}></Dialog>;
			})}
		</div>
	);
}

function AddFriend() {
	const addFriendStatuses: Record<AddFriendStatus, string> = {
		[AddFriendStatus.OK]: "friend request sent",
		[AddFriendStatus.ALREADY_SENT]: "friend request had already sent",
		[AddFriendStatus.RECEIVED]: "received??",
		[AddFriendStatus.USERNAME_NOT_EXIST]: "username does not exist",
		[AddFriendStatus.YOUR_USERNAME]: "can't add friend to yourself",
		[AddFriendStatus.YOU_WERE_FRIENDS]: "already friend",
	};

	const addUsername = useSignal("");
	const status = useSignal("");

	const addFriend = async () => {
		wsC2SConnection.send({
			type: ActionType.ADD_FRIEND,
			username: addUsername.value,
		});
		const res = await wsC2SConnection.wait("ADD_FRIEND");
		status.value = addFriendStatuses[res.status];
	};

	return (
		<>
			<div className={tw`flex mt-4`}>
				<input
					type="text"
					onInput={(e) => addUsername.value = e.currentTarget.value}
					className={tw`w-full py-1 px-2 bg-yellow-100 rounded-md`}
				/>
				<button
					onClick={addFriend}
					className={tw`ml-2 px-2 py-0.5 text-yellow-600 font-bold rounded-md`}
				>
					add
				</button>
			</div>
			<p>{status.value}</p>
		</>
	);
}

function Dialog(props: { username: string }) {
	useSignalEffect(() => {
		if (
			!wsP2PConnections.get(props.username) &&
			state.friends.value.find((f) => f.username == props.username)?.state
					.type === FriendStatus.ONLINE
		) {
			wsC2SConnection.send({
				type: ActionType.CONNECT,
				username: props.username,
			});
		}
	});

	const inputMessage = useSignal("");

	const sendMessage = () => {
		wsP2PConnections.get(props.username)!
			.send(
				{
					type: ActionType.SEND_MESSAGE,
					content: inputMessage.value,
				},
			);
	};

	return (
		<div
			className={tw`w-64 h-full bg-white p-5 bg-opacity-80`}
			style={{
				backdropFilter: "blur(5px)",
			}}
		>
			<h3 className={tw`font-display text-3xl`}>{props.username}</h3>
			{state.dialogs.value.get(props.username)!.map((message) => (
				<p>{message}</p>
			))}
			<div className={tw`flex mt-4`}>
				<input
					type="text"
					onInput={(e) => inputMessage.value = e.currentTarget.value}
					className={tw`w-full py-1 px-2 bg-yellow-100 rounded-md`}
				/>
				<button
					onClick={sendMessage}
					className={tw`ml-2 px-2 py-0.5 text-yellow-600 font-bold rounded-md`}
				>
					send
				</button>
			</div>
		</div>
	);
}
