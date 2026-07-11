import { type NextFunction, type Response } from "express"
import type { RegisterUserRequest } from "../types/index.ts"
import { UserService } from "../services/UserService.ts"
import type { Logger } from "winston"
import { validationResult } from "express-validator"
import jwt from "jsonwebtoken"
import type { JwtPayload } from "jsonwebtoken"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "node:url"
import createHttpError from "http-errors"
import { config } from "../config/index.ts"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default class AuthController {
    constructor(
        private userService: UserService,
        private logger: Logger,
    ) {}

    async register(
        req: RegisterUserRequest,
        res: Response,
        next: NextFunction,
    ) {
        const { firstName, lastName, email, password } = req.body

        const result = validationResult(req)
        if (!result.isEmpty()) {
            return res.status(400).json({
                errors: result.array(),
            })
        }

        this.logger.debug("New request to register a user", {
            firstName,
            lastName,
            email,
            password: "*",
        })
        try {
            const user = await this.userService.create(
                firstName,
                lastName,
                email,
                password,
            )

            this.logger.info("User has been registered", { id: user.id })

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
                next(error)
                return
            }

            const payload: JwtPayload = {
                sub: user.id.toString(),
                role: user.role,
            }
            const accessToken = jwt.sign(payload, privateKey, {
                algorithm: "RS256",
                expiresIn: "1h",
                issuer: "auth-service",
            })

            const refreshToken = jwt.sign(
                payload,
                config.REFRESH_TOKEN_SECRET,
                {
                    algorithm: "HS256",
                    expiresIn: "1y",
                    issuer: "auth-service",
                },
            )

            res.cookie("accessToken", accessToken, {
                domain: "localhost",
                sameSite: "strict",
                maxAge: 1000 * 60 * 60,
                httpOnly: true,
            })

            res.cookie("refreshToken", refreshToken, {
                domain: "localhost",
                sameSite: "strict",
                maxAge: 1000 * 60 * 60 * 24 * 365,
                httpOnly: true,
            })

            res.status(201).json({
                firstName,
                lastName,
                email,
                password,
            })
        } catch (e) {
            next(e)
        }
    }
}
