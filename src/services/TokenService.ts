import jwt from "jsonwebtoken"
import type { JwtPayload } from "jsonwebtoken"
import fs from "fs"
import path from "path"
import createHttpError from "http-errors"
import type { Repository } from "typeorm"
import type { RefreshToken } from "../entities/RefreshToken.ts"
import { config } from "../config/index.ts"
import { User } from "../entities/User.ts"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export class TokenService {
    constructor(private tokenRepository: Repository<RefreshToken>) {}

    generateAccessToken(payload: JwtPayload): string {
        let privateKey = null
        try {
            privateKey = fs.readFileSync(
                path.join(__dirname, "../../certs/private.pem"),
            )
        } catch {
            const error = createHttpError(
                500,
                "error while reading private key",
            )
            throw error
        }

        const accessToken = jwt.sign(payload, privateKey, {
            algorithm: "RS256",
            expiresIn: "1h",
            issuer: "auth-service",
        })

        return accessToken
    }

    async generateRefreshToken(
        payload: JwtPayload,
        user: User,
    ): Promise<string> {
        const MS_IN_YEAR = 1000 * 60 * 60 * 24 * 365

        const newRefreshToken = await this.tokenRepository.save({
            user: user,
            expiresAt: new Date(Date.now() + MS_IN_YEAR),
        })

        const refreshToken = jwt.sign(payload, config.REFRESH_TOKEN_SECRET, {
            algorithm: "HS256",
            expiresIn: "1y",
            issuer: "auth-service",
            jwtid: newRefreshToken.id.toString(),
        })

        return refreshToken
    }

    async deleteRefreshToken(tokenId: number) {
        return await this.tokenRepository.delete({ id: tokenId })
    }
}
