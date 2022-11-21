import { RequestDecoder, ResponseDecoder } from "../protocol/decoder.ts";
import { RequestEncoder, ResponseEncoder } from "../protocol/encoder.ts";
import {
	RequestMap,
	RequestType,
	ResponseMap,
	ResponseType,
} from "../protocol/request_response.ts";
import { TCPConnection } from "./mod.ts";

export class TCPRequestResponse extends TCPConnection<RequestMap, ResponseMap> {
	constructor(conn: Deno.Conn) {
		super(
			conn,
			RequestEncoder,
			ResponseDecoder,
			(res) => ResponseType[res.type],
		);
	}
}

export class TCPResponseRequest extends TCPConnection<ResponseMap, RequestMap> {
	constructor(conn: Deno.Conn) {
		super(
			conn,
			ResponseEncoder,
			RequestDecoder,
			(req) => RequestType[req.type],
		);
	}
}
