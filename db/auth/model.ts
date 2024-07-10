import mongoose from "mongoose"

export type Gender = "Male" | "Female" | "Other" | "Unspecified"

export type UserType = {
    name: string,
    surname: string,
    gender: Gender,
    email: string,
    password: string,
}

export type UserTypeInResponse = Omit<UserType, "password"> & {id: string}
export type UserTypeInRegistration = UserType
export type UserTypeInLogin = Pick<UserType, "password" | "email">

const UserSchema = new mongoose.Schema<UserType>({
    name: {
        type: String,
        required: true,
    },
    surname: {
        type: String,
        required: true,
    },
    gender: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        default: null,
        unique: true,
        validate: {
            validator: (val: string) => {
                const emailRegex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/
                return emailRegex.test(val)
            }
        }
    },
    password: {
        type: String,
        required: true,
    },
})

const UserModel = mongoose.model("User", UserSchema)

export default UserModel