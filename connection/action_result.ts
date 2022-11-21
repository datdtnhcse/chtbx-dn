import {
	actionKey,
	ActionMap,
	resultKey,
	ResultMap,
} from "../protocol/action_result.ts";
import { WebSocketConnection } from "./mod.ts";

export class WebSocketActionResult
	extends WebSocketConnection<ActionMap, ResultMap> {
	constructor(socket: WebSocket, label: string) {
		super(socket, actionKey, resultKey, label);
	}
}

export class WebSocketResultAction
	extends WebSocketConnection<ResultMap, ActionMap> {
	constructor(socket: WebSocket, label: string) {
		super(socket, resultKey, actionKey, label);
	}
}
