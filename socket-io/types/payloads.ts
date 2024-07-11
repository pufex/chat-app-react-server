export type ErrorPayload = {
    status: number, 
    message: string,
}

export type AskToJoinChatPayload ={ 
    chat_id: string,
}

export type AskToLeavePayload = AskToJoinChatPayload

export type AskToMessagePayload = {
    chat_id: string,
    content: string,
    friend_id: string
}

export type AskAboutNotificationPayload = {
    notification_id: string,
}

export type AskToReadMessagesPayload = {
    chat_id: string,
    friend_id: string,
}

export type AskToEditMessagePayload = {
    message_id: string,
    new_content: string
}

export type AskToRemoveMessagePayload = {
    message_id: string,
}

