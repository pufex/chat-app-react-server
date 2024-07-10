import type { ExpressController } from "../../types";
import type { CreateChatPayload} from "./model";
import type { ChatTypeInResponseWithMessages } from "./model";
import Chat from "./model";
import User from "../auth/model";
import { 
    getChatsWithUsers,
    getChatWithUsers,
    addMessagesToChatResponse,
} from "./helpers";
import mongoose from "mongoose";

const URI = process.env.MONGODB_KEY as string

export const getUserChats: ExpressController = async (req, res) => {
    const id = req.params.id
    if(!mongoose.Types.ObjectId.isValid(id))
        return res.status(400).json({message: "Invalid user id."})
    try{
        const chatsWithUsers = await getChatsWithUsers(id)
        res.json(chatsWithUsers)
    }catch(err){
        console.log(err)
        res.status(500).json([])
    }
}

export const getUserChatWithMessages: ExpressController = async (req, res) => {
    const id = req.params.id
    if(!mongoose.Types.ObjectId.isValid(id))
        return res.status(400).json({message: "Invalid user id."})

    try{
        const chatWithUsers = await getChatWithUsers(id)
        if(!chatWithUsers)
            return res.status(404).json({message: "Chat not found."})
        const chatWithMessages = await addMessagesToChatResponse(chatWithUsers)
        res.json(chatWithMessages)
    }catch(err){
        console.log(err)
        res.status(500).json(null)
    }
}

export const createChat: ExpressController = async (req, res) => {  
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

    try{
        await session.withTransaction(async () => {
            try{
                const user = req.user
                if(!user){
                    res.sendStatus(401)
                    throw new Error("Unauthorised")
                }
                const {id: user_id} = user
                const {email: friend_email} = req.body as CreateChatPayload

                if(user.email === friend_email){
                    res.status(409).json({message: "Provided email is user's own email.", code: "same"})
                    throw new Error("Provided email is user's own email.")
                }

                const friendQuery = {email: friend_email}
                const friend = await User.findOne(friendQuery)
                    .exec()
                if(!friend){
                    res.status(404).json({message: "Friend not found."})
                    throw new Error("Friend not found")
                }
                
                const {id: friend_id} = friend
                const bothIds = [friend_id, user_id]

                const existingChatQuery = { users_ids: { $all: bothIds } }
                const existingChat = await Chat.findOne(existingChatQuery)
                    .exec()
                if(existingChat){
                    res.status(409).json({message: "This chat was already created."})
                    throw new Error("Chat already created")
                }

                await Chat.create({users_ids: bothIds})
                const chatWithUsers = await getChatWithUsers(user_id)
                if(!chatWithUsers){
                    res.sendStatus(500)
                    throw new Error("Internal server error.")
                }
                const betterChat: ChatTypeInResponseWithMessages = {
                    ...chatWithUsers,
                    messages: []
                }

                await session.commitTransaction()
                res.status(201).json({chat: betterChat})
            }catch(err){
                console.log("Transaction failed. Discarding all changes...")
                console.log(err)
                await session.abortTransaction()
                return res.sendStatus(500)
            }
        }, transactionOptions)
    }catch(err){
        console.log(err)
    }finally{
        return await session.endSession()
    }    
}