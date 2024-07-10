import type { EventController } from "../types";
import type { 
    ErrorPayload,
    AskToMessagePayload,
    AskAboutNotificationPayload,
} from "../types/payloads";
import type { MessageTypeInResponse } from "../../db/messages/model";

import Message from "../../db/messages/model";
import Chat from "../../db/chats/model";

import mongoose from "mongoose";

const URI = process.env.MONGODB_KEY as string

export const handleMessageAsk: EventController = (io, socket) => {
    return async ({
        chat_id,
        content,
        friend_id
    }: AskToMessagePayload) => {

        const mongoClient = await mongoose.connect(URI)
        const session = await mongoClient.startSession()

        const transactionOptions: mongoose.mongo.TransactionOptions = {
            readPreference: "primary",
            readConcern: {
                level: "local"
            },
            writeConcern: {
                w: "majority"
            },
        }

        let error: ErrorPayload = {status: 500, message: "Something went wrong"}
        try{
            await session.withTransaction(async () => {
                try{
                    const user = socket.user
                    if(!user){
                        error = {status: 401, message: "Unauthorised."}
                        throw new Error("Unauthorised")
                    }

                    const user_id = user.id

                    const chat = await Chat.findById(chat_id)
                        .exec()
                    if(!chat){
                        error = {status: 404, message: "Chat not found."}
                        throw new Error("Chat not found.")
                    }

                    const newMessage = await Message.create({chat_id, user_id, content})
                    const betterMessage: MessageTypeInResponse = {
                        id: newMessage._id.toString(),
                        content: newMessage.content,
                        createdOn: newMessage.createdOn,
                        updatedOn: newMessage.updatedOn,
                        isRead: newMessage.isRead,
                        user, chat_id
                    }

                    chat.lastMessage = content
                    await chat.save()

                    await session.commitTransaction()
                    io.to(friend_id).emit("giveMessage", {message: betterMessage})
                    socket.emit("sendMessageSuccess", {message: betterMessage})
                }catch(err){
                    console.log(err)
                    await session.abortTransaction()
                    return socket.emit("sendMessageError", error)
                }
            }, transactionOptions)
        }catch(err){
            console.log(err)
            return socket.emit("sendMessageError", error)
        }finally{
            await session.endSession()
        }        
    }
}