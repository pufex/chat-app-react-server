import express from "express"
import { 
    getUserChats,
    getUserChatWithMessages,
    createChat 
} from "./controllers"

const ChatsRouter = express.Router()

ChatsRouter.get("/:id", getUserChats)
ChatsRouter.get("/:id/with-messages", getUserChatWithMessages)
ChatsRouter.post("/", createChat)

export default ChatsRouter