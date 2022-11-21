import { MessageDecoder } from "../protocol/decoder.ts";
import { MessageEncoder } from "../protocol/encoder.ts";
import { messageKey, MessageMap } from "../protocol/message.ts";
import { TCPConnection } from "./mod.ts";

export class TCPMessageMessage extends TCPConnection<MessageMap, MessageMap> {
	constructor(conn: Deno.Conn, label: string) {
		super(
			conn,
			MessageEncoder,
			MessageDecoder,
			messageKey,
			messageKey,
			label,
		);
	}
}
