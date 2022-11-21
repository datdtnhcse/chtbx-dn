import {
	ActionMap,
	ActionType,
	ResultMap,
	ResultType,
} from "../protocol/action_result.ts";
import { WebSocketConnection } from "./mod.ts";

export class WebSocketActionResult
	extends WebSocketConnection<ActionMap, ResultMap> {
	constructor(socket: WebSocket) {
		super(socket, (res) => ResultType[res.type]);
	}
}

export class WebSocketResultAction
	extends WebSocketConnection<ResultMap, ActionMap> {
	constructor(socket: WebSocket) {
		super(socket, (act) => ActionType[act.type]);
	}
}
