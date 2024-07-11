import type { UserTypeInResponse } from "../auth/model"
import mongoose from "mongoose"

export type MessageType = {
    chat_id: string,
    user_id: string,
    content: string | null,
    createdOn: Date,
    updatedOn: Date,
    isRead: boolean,
    isRemoved: boolean,
    wasEdited: boolean,
}

export type MessageTypeInResponse = Omit<MessageType, "user_id"> & {id: string, user: UserTypeInResponse}

export type EditMessagePayload = Pick<MessageType, "content">

const MessageSchema = new mongoose.Schema<MessageType>(
    {
        chat_id: {
            type: String,
            required: true,
        },
        user_id: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: function() {
                return this.content === undefined 
                                    || 
                (this.content !== null && typeof this.content !== "string") 
            }
        },
        createdOn: {
            type: Date,
            default: () => new Date(),
        },
        updatedOn: {
            type: Date,
            default: () => new Date(),
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        isRemoved: {
            type: Boolean,
            default: false
        },
        wasEdited: {
            type: Boolean,
            default: false
        },
    },
    { timestamps: true }
)

const MessageModel = mongoose.model("Message", MessageSchema)

export default MessageModel