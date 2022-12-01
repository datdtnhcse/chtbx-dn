import { RequestDecoder, ResponseDecoder } from "../protocol/decoder.ts";
import { RequestEncoder, ResponseEncoder } from "../protocol/encoder.ts";
import {
	requestKey,
	RequestMap,
	responseKey,
	ResponseMap,
} from "../protocol/request_response.ts";
import { TCPConnection } from "./tcp.ts";

export class TCPRequestResponse extends TCPConnection<RequestMap, ResponseMap> {
	constructor(
		conn: Deno.Conn,
		label = "Unamed TCP-request-response connection",
	) {
		super(
			conn,
			RequestEncoder,
			ResponseDecoder,
			requestKey,
			responseKey,
			label,
		);
	}
}

export class TCPResponseRequest extends TCPConnection<ResponseMap, RequestMap> {
	constructor(conn: Deno.Conn, label: string) {
		super(
			conn,
			ResponseEncoder,
			RequestDecoder,
			responseKey,
			requestKey,
			label,
		);
	}
}
