import { type Request } from "express"
import type { JwtPayload } from "jsonwebtoken"

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

export interface AuthRequest extends Request {
    auth?: {
        sub: number
        role: number
        jti?: string
    }
}

export interface AuthCookie {
    accessToken?: string
    refreshToken?: string
}

export interface RefreshTokenPayload extends JwtPayload {
    id: string | number
}

export interface TenantRequest extends Request {
    body: {
        name: string
        address: string
    }
}
