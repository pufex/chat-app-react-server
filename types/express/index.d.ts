import type { UserTypeInResponse } from "../../db/auth/model";

export {}

declare global {
    namespace Express {
        export interface Request {
            user?: UserTypeInResponse
        }
    }
}