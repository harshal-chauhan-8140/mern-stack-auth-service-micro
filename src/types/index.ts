import { type Request } from "express"

export interface UserRegisterData {
    firstName: string
    lastName: string
    email: string
    password: string
    role: string
}

export interface RegisterUserRequest extends Request {
    body: UserRegisterData
}

export interface UserLoginData {
    email: string
    password: string
}

export interface LoginUserRequest extends Request {
    body: UserLoginData
}
