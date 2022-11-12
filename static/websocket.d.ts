import {
	LoginRequest,
	LoginResponse,
	RegisterRequest,
	RegisterResponse,
} from "../message.ts";

declare function send(req: LoginRequest): Promise<LoginResponse>;
declare function send(req: RegisterRequest): Promise<RegisterResponse>;
