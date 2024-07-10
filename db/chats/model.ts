import type { MessageTypeInResponse } from "../messages/model";
import type { UserTypeInResponse } from "../auth/model";
import mongoose from "mongoose";

export type ChatType = {
    users_ids: string[],
    lastMessage: string,
}

export type ChatTypeInResponse = Omit<ChatType, "users_ids"> & {id: string, users: UserTypeInResponse[] }
export type ChatTypeInResponseWithMessages = ChatTypeInResponse & {messages: MessageTypeInResponse[]}
export type CreateChatPayload = {email: string}

const ChatSchema = new mongoose.Schema<ChatType>({
    users_ids: {
        type: [String],
        required: true,
    },
    lastMessage: {
        type: String,
        default: null,
    }
})

const ChatModel = mongoose.model("Chat", ChatSchema)

export default ChatModel