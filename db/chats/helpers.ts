import type { FilterQuery } from "mongoose"
import { UserTypeInResponse } from "../auth/model"
import type { ChatTypeInResponse, ChatTypeInResponseWithMessages, LastMessageType } from "./model"
import type { MessageTypeInResponse } from "../messages/model"
import Chat from "./model"
import User from "../auth/model"
import Message from "../messages/model"
import mongoose from "mongoose"

export const objectifyIds = (ids: string[]) => ids.map(id => new mongoose.Types.ObjectId(id))

export const getChatsWithUsers = async (user_id: string) => {
    const chatsQuery = {users_ids: user_id}
    const chats = await Chat.find(chatsQuery)
        .lean().exec()

    if(!chats.length)
        return []

    const ids: string[] = [user_id]
    
    chats.forEach((chat) => chat
        .users_ids
        .forEach((id) => {
            if(id !== user_id)
                ids.push(id)
        })
    )

    const idsForQuery = objectifyIds(ids)
    const usersQuery = {_id: { $in: idsForQuery }}
    const users = await User.find(usersQuery)
        .exec()
    const user_document = users.find((user) => user.id === user_id)
    if(!user_document) throw new Error("Corrupted data detected.")
    const betterUser: UserTypeInResponse = {
        id: user_document.id,
        name: user_document.name,
        surname: user_document.surname,
        email: user_document.email,
        gender: user_document.gender,
    }

    const chatInResponse: ChatTypeInResponse[] = chats.map((chat) => {
        const friend_id = chat.users_ids[0] === user_id
            ? chat.users_ids[0]
            : chat.users_ids[1]
        const friend = users.find((user) => user.id === friend_id)
        if(!friend)
        return {
            id: chat._id.toString(), 
            users: [betterUser],
            last_message_id: chat.last_message_id
        }
        const betterFriend: UserTypeInResponse = {
            id: friend.id,
            name: friend.name,
            surname: friend.surname,
            email: friend.email,
            gender: friend.gender,
        }
        return {
            id: chat._id.toString(),
            users: [betterUser, betterFriend],
            last_message_id: chat.last_message_id
        }
    })
    return chatInResponse
}

export const getChatWithUsers = async (user_id: string) => {
    const chatQuery = {users_ids: user_id}
    const chat = await Chat.findOne(chatQuery)
        .lean().exec()

    if(!chat)
        return null

    const {users_ids} = chat
    const idsForQuery = objectifyIds(users_ids)
    const bothUsersQuery = {_id: { $in: idsForQuery }}
    const bothUsers = await User.find(bothUsersQuery)
        .exec()
    if(bothUsers.length === 0)
        return null

    const betterUsers: UserTypeInResponse[] = bothUsers
        .map((user) => ({
            id: user.id,
            name: user.name,
            surname: user.surname,
            email: user.email,
            gender: user.gender,
        }))
    const chatWithUsers: ChatTypeInResponse = {
        id: chat._id.toString(),         
        users: betterUsers,
        last_message_id: chat.last_message_id
    }
    return chatWithUsers
}

export const addMessagesToChatResponse = async (chat: ChatTypeInResponse) => {
    const chat_id = chat.id
    const messagesQuery = {chat_id}
    const messages = await Message.find(messagesQuery)
        .exec()
    
    if(!messages.length)
        return {...chat, messages: [], last_message: null}

    const betterMessages: MessageTypeInResponse[] = messages.map(message => ({
        id: message.id,
        content: message.content,
        createdOn: message.createdOn,
        updatedOn: message.updatedOn,
        chat_id: message.chat_id,
        isRead: message.isRead,
        isRemoved: message.isRemoved,
        wasEdited: message.wasEdited,
        user: chat.users[0].id === message.user_id
            ? chat.users[0]
            : chat.users[1]
    }))

    const recentMessage = messages.find(message => message._id.toString() === chat.last_message_id)
    const last_message: LastMessageType = !recentMessage
        ? null
        : {
            message_id: recentMessage.id,
            content: recentMessage.content
        }

    const betterChat: ChatTypeInResponseWithMessages = {
        ...chat, 
        messages: betterMessages,
        last_message
    }
    return betterChat
}