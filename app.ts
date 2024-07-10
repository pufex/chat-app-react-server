import { config } from "dotenv";
config()

import corsOptions from "./config/corsOptions";

import express from "express"
import mongoose from "mongoose";

import cors from "cors"
import cookieParser from "cookie-parser";
import verifyJWT from "./middleware/verifyJWT";

import AuthRouter from "./db/auth/routes";
import ChatsRouter from "./db/chats/routes";

import { Server } from "socket.io";

import { verifyAccessToken } from "./socket-io/middleware";

import { beginUserSession } from "./socket-io/functions";

import { 
    handleMessageAsk,
} from "./socket-io/controllers/chat";

import {
    handleDisconnect
} from "./socket-io/controllers/connection"

const URI = process.env.MONGODB_KEY as string
const PORT = process.env.PORT || 9000

const app = express()

app.use(express.static("/public"))
app.use(express.json())
app.use(cookieParser())
app.use(cors(corsOptions))

app.use("/auth", AuthRouter)

app.use(verifyJWT)
app.use("/chats", ChatsRouter)

mongoose.connect(URI)
    .then(() => {
        console.log("Connected to the Database.")
        const server = app.listen(PORT, () => console.log(`Listening to requests from http://localhost:${PORT}`))

        const io = new Server(server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        })

        io.use(verifyAccessToken)
        io.on("connection", socket => {
            console.log(`User (${socket.id}) connected`)

            beginUserSession(io, socket)

            socket.on("askToMessage", handleMessageAsk(io, socket))
            socket.on("disconnect", handleDisconnect(io ,socket))
        })
    })
    .catch(err => {
        console.log("Failed to connect to the Database.")
        console.log(err)
        process.exit(1)
    })