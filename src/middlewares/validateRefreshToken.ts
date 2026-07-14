import { expressjwt } from "express-jwt"
import { config } from "../config/index.ts"
import type { Request } from "express"
import type { AuthCookie, RefreshTokenPayload } from "../types/index.ts"
import { AppDataSource } from "../data-source.ts"
import { RefreshToken } from "../entities/RefreshToken.ts"
import logger from "../config/logger.ts"

export default expressjwt({
    secret: config.REFRESH_TOKEN_SECRET,
    algorithms: ["HS256"],
    getToken(req: Request) {
        const { refreshToken } = req.cookies as AuthCookie
        return refreshToken
    },
    async isRevoked(req: Request, token) {
        const payload = token?.payload as RefreshTokenPayload

        try {
            const refreshTokenRepository =
                AppDataSource.getRepository(RefreshToken)
            const refreshToken = await refreshTokenRepository.findOne({
                where: {
                    id: Number(payload.jti),
                    user: {
                        id: Number(payload.sub),
                    },
                },
            })

            return refreshToken === null
        } catch {
            logger.error("Error while getting the refresh token.", {
                id: payload.id,
            })
            return true
        }
    },
})
