import express from 'express'

import { 
    register,
    login,
    refresh,
    logout
} from './controllers'

const AuthRouter = express.Router()

AuthRouter.post("/register", register)
AuthRouter.post("/login", login)
AuthRouter.get("/refresh", refresh)
AuthRouter.get("/logout", logout)

export default AuthRouter