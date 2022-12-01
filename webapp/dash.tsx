import { useSignal, useSignalEffect } from "@preact/signals";
import { createContext } from "preact";
import { useContext } from "preact/hooks";
import { tw } from "twind";
import { ActionType } from "../protocol/action_result.ts";
import {
	AddFriendStatus,
	Friend,
	FriendStatus,
} from "../protocol/request_response.ts";
import { state, wsC2SConnection, wsP2PConnections } from "./state.ts";

export default function Dash() {
	useSignalEffect(() => {
		document.title = "Dashboard | CHTBX";
		wsC2SConnection.send({ type: ActionType.SYNC });
	});

	const logout = () => {
		wsC2SConnection.send({ type: ActionType.LOGOUT });
	};

	const sync = () => {
		wsC2SConnection.send({ type: ActionType.SYNC });
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
				<div className={tw`mt-3 flex justify-between border-b pb-4`}>
					<p>
						hello,{" "}
						<span className={tw`font-bold`}>{state.username}</span>
					</p>
					<button
						onClick={logout}
						className={tw`text-gray-300 font-bold hover:(text-underline)`}
					>
						logout
					</button>
				</div>
				<div className={tw`mt-4 flex items-center justify-between`}>
					<h2 className={tw`font-display font-bold text-2xl`}>
						your friends
					</h2>
					<button
						onClick={sync}
						className={tw`ml-2 px-2 text-yellow-600 font-bold rounded-md`}
					>
						sync
					</button>
				</div>
				<ol className={tw`mt-4 list-sqaure pl-4`}>
					{state.friends.value.map((friend) => (
						<li className={tw`pl-1`}>
							<FriendItem friend={friend} />
						</li>
					))}
				</ol>
				<AddFriend />
			</div>
			{[...state.dialogs.value.entries()].map(([username, dialog]) =>
				(state.connecteds.value.has(username) || dialog.length != 0) &&
				<Dialog username={username}></Dialog>
			)}
		</div>
	);
}

function AddFriend() {
	const addFriendStatuses: Record<AddFriendStatus, string> = {
		[AddFriendStatus.OK]: "friend request sent",
		[AddFriendStatus.ALREADY_SENT]: "friend request had already sent",
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
		wsC2SConnection.send({ type: ActionType.SYNC });
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

const DialogContext = createContext<{ username: string } | null>(null);

function Dialog(props: { username: string }) {
	return (
		<DialogContext.Provider value={{ username: props.username }}>
			<div
				className={tw`w-64 h-full flex flex-col bg-white p-5 bg-opacity-80 rounded-md`}
				style={{
					backdropFilter: "blur(5px)",
				}}
			>
				<h3 className={tw`font-display text-3xl border-b pb-3`}>
					{props.username}
				</h3>
				<ul
					className={tw`mt-3 space-y-1 flex-grow overflow-y-auto`}
				>
					{state.dialogs.value.get(props.username)!.map((
						message,
					) => {
						const isSelf = state.username.value === message.author;

						return (
							<li>
								<p>
									<span
										className={tw`font-bold ${
											isSelf ? "text-yellow-500" : ""
										}`}
									>
										⟨{isSelf ? "you" : message.author}⟩
									</span>{" "}
									{message.content}
								</p>
							</li>
						);
					})}
				</ul>
				<DialogSend />
			</div>
		</DialogContext.Provider>
	);
}

function formatBytes(bytes: number, decimals = 2) {
	if (!+bytes) return "0 Bytes";

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function DialogSend() {
	const filePath = useSignal("");
	const file = useSignal<File | null>(null);
	const inputMessage = useSignal("");
	const { username } = useContext(DialogContext)!;
	const controller = useSignal(new AbortController());

	const sendMessage = async () => {
		if (inputMessage.value != "" || file.value === null) {
			await wsP2PConnections.get(username)!.send({
				type: ActionType.SEND_MESSAGE,
				content: inputMessage.value,
			});
			inputMessage.value = "";
		}
		if (filePath.value) {
			await wsP2PConnections.get(username)!.send({
				type: ActionType.SEND_MESSAGE,
				content: `đã gửi file ${file.value!.name} (${
					formatBytes(file.value!.size)
				})`,
			});
			await wsP2PConnections.get(username)!.send({
				type: ActionType.FILE_OFFER,
				name: file.value!.name,
				size: file.value!.size,
			});
			controller.value.abort();
			controller.value = new AbortController();
			wsP2PConnections.get(username)!.on("FILE_REQUEST", async () => {
				const reader = file.value?.stream().getReader()!;
				while (true) {
					const { value, done } = await reader.read();
					if (done) return;
					await wsP2PConnections.get(username)?.send({
						type: ActionType.FILE_SEND,
						chunk: value,
					});
				}
			}, { signal: controller.value.signal });
			filePath.value = "";
		}
	};

	const download = async () => {
		wsP2PConnections.get(username)!.send({ type: ActionType.FILE_REQUEST });
		await wsP2PConnections.get(username)!.wait("FILE_REQUEST");
		alert("file download successfully");
	};

	return (
		<div className={tw`border-t pt-2 flex flex-col mt-4`}>
			{state.offeredFile.value && (
				<button
					onClick={download}
					disabled={!state.connecteds.value.has(username)}
					className={tw`w-full text-center overflow-ellipsis overflow-hidden disabled:(bg-gray-100 text-gray-500 cursor-not-allowed)`}
				>
					🔽 Tải xuống: {state.offeredFile.value.name}
				</button>
			)}
			<form
				className={tw`flex`}
				onSubmit={(e) => {
					e.preventDefault();
					sendMessage();
				}}
			>
				<input
					type="text"
					value={inputMessage.value}
					onInput={(e) => inputMessage.value = e.currentTarget.value}
					disabled={!state.connecteds.value.has(username)}
					className={tw`mt-2 w-full py-1 px-2 bg-yellow-100 rounded-md disabled:(bg-gray-100 cursor-not-allowed)`}
				/>
				<button
					disabled={!state.connecteds.value.has(username)}
					className={tw`ml-2 px-2 py-0.5 text-yellow-600 font-bold rounded-md disabled:(text-gray-500 cursor-not-allowed)`}
				>
					send
				</button>
			</form>
			<div>
				<input
					type="file"
					value={filePath.value}
					onChange={(e) => {
						filePath.value = e.currentTarget.value;
						file.value = e.currentTarget.files?.[0] ?? null;
					}}
					disabled={!state.connecteds.value.has(username)}
					className={tw`mt-2 w-full overflow-ellipsis block file-selector-button::(
						px-2 py-1
						font-body font-bold rounded-md bg-yellow-100 text-yellow-900 border-none
						hover:cursor-pointer
					) disabled:(file-selector-button::(bg-gray-100 text-gray-500 cursor-not-allowed))`}
				/>
			</div>
		</div>
	);
}

function FriendItem(props: { friend: Friend }) {
	const accept = () => {
		wsC2SConnection.send({
			type: ActionType.ADD_FRIEND,
			username: props.friend.username,
		});
		wsC2SConnection.send({ type: ActionType.SYNC });
	};

	const connect = () => {
		wsC2SConnection.send({
			type: ActionType.CONNECT,
			username: props.friend.username,
		});
	};

	switch (props.friend.status.type) {
		case FriendStatus.ONLINE:
			return (
				<div className={tw`w-full inline-flex justify-between`}>
					<span>
						{props.friend.username}
					</span>
					{!state.connecteds.value.has(props.friend.username)
						? (
							<button
								onClick={connect}
								className={tw`px-2 py-0.5 bg-yellow-500 text-white font-bold rounded-md`}
							>
								connect
							</button>
						)
						: (
							<span className={tw`text-green-500 font-bold`}>
								connected
							</span>
						)}
				</div>
			);
		case FriendStatus.RECEIVED:
			return (
				<div className={tw`w-full inline-flex justify-between`}>
					<span>
						{props.friend.username}
					</span>
					<button
						onClick={accept}
						className={tw`px-2 py-0.5 bg-yellow-500 text-white font-bold rounded-md`}
					>
						accept
					</button>
				</div>
			);
		case FriendStatus.OFFLINE:
		case FriendStatus.SENT:
			return (
				<div className={tw`w-full inline-flex justify-between`}>
					<span>
						{props.friend.username}
					</span>
					<span className={tw`text-gray-500`}>
						{FriendStatus[props.friend.status.type]}
					</span>
				</div>
			);
	}
}
