import { MessageDecoder } from "../protocol/decoder.ts";
import { MessageEncoder } from "../protocol/encoder.ts";
import { MessageMap, MessageType } from "../protocol/message.ts";
import { TCPConnection } from "./mod.ts";

export class TCPMessageMessage extends TCPConnection<MessageMap, MessageMap> {
	constructor(conn: Deno.Conn) {
		super(
			conn,
			MessageEncoder,
			MessageDecoder,
			(mes) => MessageType[mes.type],
		);
	}
}
