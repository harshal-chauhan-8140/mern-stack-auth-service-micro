import { type Request } from "express"

export interface UserData {
    firstName: string
    lastName: string
    email: string
    password: string
    role: string
}

export interface RegisterUserRequest extends Request {
    body: UserData
}
