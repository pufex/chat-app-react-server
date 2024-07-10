import type { ExpressController } from "../../types";
import type { 
    UserTypeInResponse,
    UserTypeInRegistration,
    UserTypeInLogin
} from "./model";

import User from "./model";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

export const register: ExpressController = async (req, res) => {
    const {
        email, 
        gender, 
        name, 
        password, 
        surname
    } = req.body as UserTypeInRegistration

    const existingUserQuery = {email}
    const existingUser = await User.findOne(existingUserQuery)
        .exec()
    if(existingUser)
        return res.status(409).json({message: "Email is already taken."})

    const hashedPassword = await bcrypt.hash(password, 10)
    
    try{
        await User.create({email, gender, name, password: hashedPassword, surname})
    }catch(err){
        console.log(err)
        return res.status(400).json({message: "Provided credentials are not valid."})
    }

    res.status(201).json({message: `User ${name} ${surname} created!`})

}

export const login: ExpressController = async (req, res) => {
    const {email, password} = req.body as UserTypeInLogin

    const userQuery = {email}
    const user = await User.findOne(userQuery)
        .exec()
    if(!user)
        return res.sendStatus(402)

    const hashedPassword = user.password
    const isMatch = await bcrypt.compare(password, hashedPassword)
    if(!isMatch)
        return res.status(409).json({message: "Invalid username or password."})

    const payload: UserTypeInResponse = {
        id: user.id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        gender: user.gender,
    }

    const refreshToken = jwt.sign(
        payload,
        process.env.REFRESH_TOKEN_SECRET as string,
        {expiresIn: "30d"}
    )

    const accessToken = jwt.sign(
        payload,
        process.env.ACCESS_TOKEN_SECRET as string,
        {expiresIn: "20m"}
    )

    res.cookie('token', refreshToken, {
        maxAge: 1000*60*60*24*30,
        httpOnly: true,
        sameSite: "none",
        secure: true,
    })
    res.json({accessToken, user: payload})
}

export const refresh: ExpressController = (req, res) => {
    const token = req.cookies.token
    if(!token)
        return res.sendStatus(401)
    jwt.verify(
        token,
        process.env.REFRESH_TOKEN_SECRET as string,
        {},
        async (err, decoded) => {
            if(err)
                return res.sendStatus(401)

            const userObj = decoded as UserTypeInResponse
            const {id} = userObj
            const user = await User.findById(id)
                .exec()
            if(!user)
                return res.sendStatus(401)
            const payload: UserTypeInResponse = {
                id: user.id,
                name: user.name,
                surname: user.surname,
                email: user.email,
                gender: user.gender,
            }

            const accessToken = jwt.sign(
                payload,
                process.env.ACCESS_TOKEN_SECRET as string,
                {expiresIn: "20m"}
            )
            res.status(200).json({accessToken, user: payload})
        }
    )
}

export const logout: ExpressController = (req, res) => {
    const token = req.cookies.token
    if(!token)
        return res.sendStatus(204)

    res.clearCookie("token", {
        httpOnly: true,
        secure:true,
        sameSite: "none",
    })
    res.sendStatus(200)
}