import { type Request } from "express"
import type { JwtPayload } from "jsonwebtoken"

export interface UserRegisterData {
    firstName: string
    lastName: string
    email: string
    password: string
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
        role: string
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
    auth?: {
        sub: number
        role: string
        jti?: string
    }
    body: {
        name: string
        address: string
    }
}

export interface UserData {
    fistName: string
}

export interface CreateUserRequest extends Request {
    body: {
        firstName: string
        lastName: string
        email: string
        password: string
        role?: string
    }
}

export interface UpdateUserRequest extends Request {
    body: {
        firstName: string
        lastName: string
        role: string
    }
}
