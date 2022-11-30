import { useSignal } from "@preact/signals";
import { tw } from "twind";
import { ActionType } from "../protocol/action_result.ts";
import { LoginStatus, RegisterStatus } from "../protocol/request_response.ts";
import { state, wsC2SConnection } from "./state.ts";

const loginStatuses: Record<LoginStatus, string> = {
	[LoginStatus.OK]: "okay",
	[LoginStatus.ALREADY_LOGGED_IN]: "already logged in elsewhere",
	[LoginStatus.USERNAME_NOT_EXIST]: "username does not exist",
	[LoginStatus.WRONG_PASSWORD]: "wrong password",
};

const registerStatuses: Record<RegisterStatus, string> = {
	[RegisterStatus.OK]: "okay, press login",
	[RegisterStatus.USERNAME_IS_EXIST]: "username already existed",
};

export default function Login() {
	const inputUsername = useSignal("");
	const inputPassword = useSignal("");
	const status = useSignal("");

	const login = async () => {
		wsC2SConnection.send({
			type: ActionType.LOGIN,
			username: inputUsername.value,
			password: inputPassword.value,
		});
		const res = await wsC2SConnection.wait("LOGIN");
		if (res.status == LoginStatus.OK) {
			state.username.value = inputUsername.value;
		}
		status.value = loginStatuses[res.status];
	};

	const register = async () => {
		wsC2SConnection.send({
			type: ActionType.REGISTER,
			username: inputUsername.value,
			password: inputPassword.value,
		});
		const res = await wsC2SConnection.wait("REGISTER");
		status.value = registerStatuses[res.status];
	};

	return (
		<>
			<div
				className={tw`w-full max-w-xs flex flex-col items-start font-body space-y-3 p-5 bg-white bg-opacity-70 rounded-md`}
				style={{
					backdropFilter: "blur(5px)",
				}}
			>
				<h1
					className={tw`w-full font-display text-5xl text-gray-900 text-center`}
				>
					CHTBX
				</h1>
				<label className={tw`w-full`}>
					<p className={tw`font-bold`}>
						username
					</p>
					<input
						type="text"
						className={tw`px-2 py-1 w-full bg-yellow-100 rounded-md`}
						onInput={(e) =>
							inputUsername.value = e.currentTarget.value}
					/>
				</label>
				<label className={tw`w-full`}>
					<p className={tw`font-bold`}>
						password
					</p>
					<input
						type="password"
						className={tw`px-2 py-1 w-full bg-yellow-100 rounded-md`}
						onInput={(e) =>
							inputPassword.value = e.currentTarget.value}
					/>
				</label>
				<div class="flex items-center">
					<button
						className={tw`px-2 py-0.5 bg-yellow-300 text-yellow-900 font-bold rounded-md`}
						onClick={login}
					>
						login
					</button>
					<button
						className={tw`ml-2 px-2 py-0.5 text-yellow-600 font-bold rounded-md`}
						onClick={register}
					>
						register
					</button>
				</div>
				<p>{status.value}</p>
			</div>
		</>
	);
}
