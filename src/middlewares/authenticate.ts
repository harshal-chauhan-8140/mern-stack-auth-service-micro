import { expressjwt, type GetVerificationKey } from "express-jwt"
import jwksClient from "jwks-rsa"
import { config } from "../config/index.ts"
import type { Request } from "express"
import type { AuthCookie } from "../types/index.ts"

export default expressjwt({
    secret: jwksClient.expressJwtSecret({
        jwksUri: config.JWKS_URI,
        cache: true,
        rateLimit: true,
    }) as GetVerificationKey,
    algorithms: ["RS256"],
    getToken(req: Request) {
        const authHeader = req.headers.authorization

        if (authHeader && authHeader.split(" ")[1] !== "undefined") {
            const token = authHeader.split(" ")[1]
            if (token) {
                return token
            }
        }

        const { accessToken } = req.cookies as AuthCookie
        return accessToken
    },
})
