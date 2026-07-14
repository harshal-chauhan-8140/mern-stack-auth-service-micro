import { expressjwt } from "express-jwt"
import { config } from "../config/index.ts"
import type { Request } from "express"
import type { AuthCookie } from "../types/index.ts"

export default expressjwt({
    secret: config.REFRESH_TOKEN_SECRET,
    algorithms: ["HS256"],
    getToken(req: Request) {
        const { refreshToken } = req.cookies as AuthCookie
        return refreshToken
    },
})
