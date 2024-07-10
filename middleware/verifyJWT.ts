import type { ExpressController } from "../types";
import type { UserTypeInResponse } from "../db/auth/model";

import User from "../db/auth/model";
import jwt from "jsonwebtoken"

const verifyJWT: ExpressController = (req, res, next) => {
    const authHeader = req.headers.authorization
    if(!authHeader || !authHeader.startsWith("Bearer "))
        return res.sendStatus(403)

    const token = authHeader.split(" ")[1]
    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET as string,
        {},
        async (err, decoded) => {
            if(err)
                return res.sendStatus(403)

            const userObj = decoded as UserTypeInResponse
            const {id} = userObj
            const user = await User.findById(id)
                .exec()
            if(!user)
                return res.sendStatus(403)

            const payload: UserTypeInResponse = {
                id: user.id,
                name: user.name,
                surname: user.surname,
                email: user.email,
                gender: user.gender,
            }
            req.user = payload
            next()
        }
    )
}

export default verifyJWT