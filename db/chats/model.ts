import type { MessageTypeInResponse } from "../messages/model";
import type { UserTypeInResponse } from "../auth/model";
import mongoose from "mongoose";

export type ChatType = {
    users_ids: string[],
    last_message_id: string | null
}

export type LastMessageType = {message_id: string, content: string | null} | null

export type ChatTypeInResponse = Omit<ChatType, "users_ids"> & {id: string, users: UserTypeInResponse[] }
export type ChatTypeInResponseWithMessages = Omit<ChatTypeInResponse, "last_message_id"> & {messages: MessageTypeInResponse[], last_message: LastMessageType}
export type CreateChatPayload = {email: string}

const ChatSchema = new mongoose.Schema<ChatType>({
    users_ids: {
        type: [String],
        required: true,
    },
    last_message_id: {
        type: String,
        default: null,
    }
})

const ChatModel = mongoose.model("Chat", ChatSchema)

export default ChatModel