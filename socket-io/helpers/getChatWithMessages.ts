import type { FilterQuery } from "mongoose";
import type { ChatType, ChatTypeInResponseWithMessages } from "../../db/chats/model";
import type { MessageTypeInResponse } from "../../db/messages/model";
import Chat from "../../db/chats/model";
import Message from "../../db/messages/model";

const getChatWithMessages = async (query: FilterQuery<ChatType> | undefined) => {
    const chat = await Chat.findOne(query)
        .exec()
    if(!chat)
        return null

    const chat_ids = chat.users_ids
    const messagesQuery = {users_ids: { $all: chat_ids }}
    const messages = await Message.find(messagesQuery)
        .exec()
    const chatWithMessages: ChatTypeInResponseWithMessages = {
        id: chat.id,
        users_ids: chat_ids,
        messages: messages
            .map(message => ({
                id: message.id,
                users_ids: message.users_ids,
                content: message.content,
                createdOn: message.createdOn,
                updatedOn: message.updatedOn,
            }))
            .sort((a,b) => new Date(a.createdOn).getTime() - new Date(b.createdOn).getTime())
    }

    return chatWithMessages
}

export default getChatWithMessages