import type { EventController } from "../types";
import type { 
    ErrorPayload,
    AskToMessagePayload,
    AskToReadMessagesPayload,
    AskToRemoveMessagePayload,
    AskToEditMessagePayload
} from "../types/payloads";
import type { MessageTypeInResponse } from "../../db/messages/model";

import Message from "../../db/messages/model";
import Chat from "../../db/chats/model";
import User from "../../db/auth/model";

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
                        isRemoved: newMessage.isRemoved,
                        wasEdited: newMessage.wasEdited,
                        user, chat_id
                    }

                    chat.last_message_id = newMessage.id
                    await chat.save()

                    await session.commitTransaction()
                    io.to(friend_id).emit("giveMessage", {message: betterMessage})
                    socket.emit("giveMessage", {message: betterMessage})
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

export const handleMessageEdit: EventController = (io, socket) => {
    return async ({message_id, new_content}: AskToEditMessagePayload) => {
        const user = socket.user
        if(!user)
            return socket.emit("messageEditError", {status: 401, message: "Unauthorised"})
        const user_id = user.id

        const message = await Message.findById(message_id)
            .exec()
        if(!message)
            return socket.emit("messageEditError", {status: 404, message: "Message not found."})
        else if(message.user_id !== user_id)
            return socket.emit("messageEditError", {status: 403, message: "Forbidden"})
        else if(message.isRemoved)
            return socket.emit("messageEditError", {status: 409, message: "Can't edit a message that was removed."})

        const chat_id = message.chat_id
        const chat = await Chat.findById(chat_id)
            .exec()
        if(!chat)
            return socket.emit("messageEditError", {status: 409, message: "The chat message belongs to doesn't exist."})

        const friend_id = chat.users_ids[0] !== user_id
            ? chat.users_ids[0]
            : chat.users_ids[1]
        
        const friend = await User.findById(friend_id)
            .exec()
        if(!friend)
            return socket.emit("messageEditError", {status: 409, message: "Friend must exist to edit this message."})

        try{
            message.content = new_content
            message.wasEdited = true
            await message.save()
            io.to(friend_id).emit("messageEdited", {chat_id, message_id, new_content})
            socket.emit("messageEdited", {chat_id, message_id, new_content})
            socket.emit("messageEditSuccess")
        }catch{
            socket.emit("messageEditError", {status: 500, message: "Internal server error"})
        }

    }
}

export const handleMessageRemoving: EventController = (io, socket) => {
    return async ({message_id}: AskToRemoveMessagePayload) => {
        const user = socket.user
        if(!user)
            return socket.emit("messageRemoveError", {status: 401, message: "Unauthorised"})
        const user_id = user.id

        const message = await Message.findById(message_id)
            .exec()
        if(!message)
            return socket.emit("messageRemoveError", {status: 404, message: "Message not found."})
        else if(message.user_id !== user_id)
            return socket.emit("messageRemoveError", {status: 403, message: "Forbidden"})
        else if(message.isRemoved)
            return socket.emit("messageRemoveError", {status: 400, message: "Message already removed"})
    
        const chat = await Chat.findById(message.chat_id)
            .exec()
        if(!chat)
            return socket.emit("messageRemoveError", {status: 409, message: "The chat this message belongs to doesn't exist."})
        const chat_id = chat._id.toString()
        const friend_id = chat.users_ids[0] !== user_id
            ? chat.users_ids[0]
            : chat.users_ids[1]

        const friend = await User.findById(friend_id)
            .exec() 
        if(!friend)
            return socket.emit("messageRemoveError", {status: 409, message: "Friend must exist to remove a message."})

        try{
            message.content = null
            message.isRemoved = true
            message.isRead = true
            await message.save()
            io.to(friend_id).emit("messageRemoved", {chat_id, message_id})
            socket.emit("messageRemoved", {chat_id, message_id})
            socket.emit("messageRemoveSuccess")
        }catch{
            socket.emit("messageRemoveError", {status: 500, message: "Internal server error"})
        }
    }
}

export const handleMessagesRead: EventController = (io, socket) => {
    return async ({chat_id, friend_id}: AskToReadMessagesPayload) => {
        const user = socket.user
        if(!user)
            return socket.emit("readMessagesError", {status: 401, message: "Unauthorised"})

        const friend = await User.findById(friend_id)
            .exec()
        if(!friend)
            return socket.emit("readMessagesError", {status: 409, message: "Your friend doesn't exist."})

        try{
            const messagesQuery = { user_id: friend_id, chat_id}
            await Message.updateMany(messagesQuery, {isRead: true})
            socket.emit("readMessageSuccess")
            socket.emit("messagesWereRead", {chat_id, user_id: friend_id})
            io.to(friend_id).emit("messagesWereRead", { chat_id, user_id: friend_id })
        }catch(err){
            socket.emit("readMessagesError", {status: 500, message: "Internal server error."})
        }
    }
}