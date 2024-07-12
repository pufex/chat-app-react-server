import type { EventController } from "./types";
import type { UserTypeInResponse } from "../db/auth/model";
import type { ChatTypeInResponseWithMessages, LastMessageType } from "../db/chats/model";
import type { MessageTypeInResponse } from "../db/messages/model";
import User from "../db/auth/model";
import Chat from "../db/chats/model";
import Message from "../db/messages/model";
import { objectifyIds } from "../db/chats/helpers";

export const beginUserSession: EventController = async (_, socket) => {
    try{
        const user = socket.user
        if(!user)
            throw new Error("Unauthorised.")

        const user_id = user.id
        const userDocument = await User.findById(user_id)
            .lean().exec()
        if(!userDocument){
            socket.emit("initError", {status: 401, message: "Unauthorised"})
            return socket.disconnect(true)
        }

        socket.rooms.forEach(room => socket.leave(room))

        const chatsQuery = { users_ids: user_id }
        const chats = await Chat.find(chatsQuery)
            .lean().exec()

        if(chats.length === 0){
            socket.join(user_id);
            return socket.emit("initSuccess", {chats: []})
        }

        const better_user: UserTypeInResponse = {
            id: userDocument._id.toString(),
            name: userDocument.name,
            surname: userDocument.surname,
            email: userDocument.email,
            gender: userDocument.gender,
        }

        const usersIds: string[] = [user_id]
        chats.forEach((chat) => {
            chat.users_ids.forEach(id => {
                if(!usersIds.includes(id))
                    usersIds.push(id)
            })
        })

        const idsForQuery = objectifyIds(usersIds)
        const usersQuery = { _id: { $in: idsForQuery } }
        const usersDocs = await User.find(usersQuery)
            .lean().exec()

        const chatsWithUsers: ChatTypeInResponseWithMessages[] = await Promise.all(chats.map(async (chat) => {
            
            const friend_id = chat.users_ids[0] !== user_id
                ? chat.users_ids[0]
                : chat.users_ids[1]
            const friend = usersDocs.find(user => user._id.toString() === friend_id)
            if(!friend){
                socket.emit("initError", {status: 500, message: "Server corrupted."})
                throw new Error("Corrupted data detected.")
            }

            const better_friend: UserTypeInResponse = {
                id: friend._id.toString(),
                name: friend.name,
                surname: friend.surname,
                email: friend.email,
                gender: friend.gender,
            }

            const messagesQuery = { chat_id: chat._id.toString() }
            const messages = await Message.find(messagesQuery)
                .lean().exec()
            const betterMessages: MessageTypeInResponse[] = messages.map(message => ({
                id: message._id.toString(),
                chat_id: message.chat_id,
                content: message.content,
                createdOn: message.createdOn,
                updatedOn: message.updatedOn,
                isRead: message.isRead,
                isRemoved: message.isRemoved,
                wasEdited: message.wasEdited,
                user: message.user_id === friend_id
                    ? better_friend
                    : better_user
            }))

            const recentMessage = messages.find(message => message._id.toString() === chat.last_message_id)
            const last_message: LastMessageType = !recentMessage
                ? null
                : {
                    message_id: recentMessage._id.toString(),
                    content: recentMessage.content
                }

            return {
                id: chat._id.toString(),
                users: [better_user, better_friend],
                messages: betterMessages,
                last_message
            }
        }))
        socket.join(user_id);
        console.log("User joined to", user_id)
        socket.emit("initSuccess", { chats: chatsWithUsers })
    }catch(err){
        console.log("User's initialization failed.")
        console.log(err)
        socket.emit("initError", {status: 500, message: "Server corrupted."})
        socket.disconnect(true)
    }
}