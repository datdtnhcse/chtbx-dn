import {
	actionKey,
	ActionMap,
	ActionType,
	GUIState,
	resultKey,
	ResultMap,
	ResultType,
} from "../protocol/action_result.ts";
import { WebSocketConnection } from "./websocket.ts";

export class WebSocketActionResult
	extends WebSocketConnection<ActionMap, ResultMap> {
	constructor(socket: WebSocket, label: string) {
		super(socket, actionKey, resultKey, label);
	}
	sync() {
		this.send({ type: ActionType.SYNC });
	}
}

export class WebSocketResultAction
	extends WebSocketConnection<ResultMap, ActionMap> {
	constructor(socket: WebSocket, label: string) {
		super(socket, resultKey, actionKey, label);
	}
	sync(state: GUIState) {
		this.send({ type: ResultType.SYNC, state });
	}
}
