import type { ServerMiddleware } from "./types";
import type { UserTypeInResponse } from "../db/auth/model";
import User from "../db/auth/model";
import jwt from "jsonwebtoken"

export const verifyAccessToken: ServerMiddleware = (
    socket,
    next
) => {
    const token = socket.handshake.auth.token
    if(!token)
        return next(new Error("Unauthorised"))

    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET as string,
        {},
        async (err, decoded) => {
            if(err)
                return next(new Error("Unauthorised"))

            const userObj = decoded as UserTypeInResponse
            const {id} = userObj
            const user = await User.findById(id)
                .exec()
            if(!user)
                return next(new Error("Unauthorised"))

            const payload: UserTypeInResponse = {
                id: user.id,
                name: user.name,
                surname: user.surname,
                email: user.email,
                gender: user.gender,
            }
            socket.user = payload
            next()
        }
    )
}