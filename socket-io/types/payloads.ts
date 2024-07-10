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
