import type { UserTypeInResponse } from "../../db/auth/model"

export {}

declare module "socket.io" {
    interface Socket {
        user?: UserTypeInResponse
    }
}