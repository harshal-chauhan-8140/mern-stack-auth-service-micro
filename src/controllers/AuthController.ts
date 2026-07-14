import { type NextFunction, type Response } from "express"
import type {
    AuthRequest,
    LoginUserRequest,
    RegisterUserRequest,
} from "../types/index.ts"
import { UserService } from "../services/UserService.ts"
import type { Logger } from "winston"
import { validationResult } from "express-validator"
import type { JwtPayload } from "jsonwebtoken"
import type { TokenService } from "../services/TokenService.ts"
import createHttpError from "http-errors"
import type { CredentialService } from "../services/CredentialService.ts"

export default class AuthController {
    constructor(
        private userService: UserService,
        private tokenService: TokenService,
        private credentialService: CredentialService,
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

            const payload: JwtPayload = {
                sub: user.id.toString(),
                role: user.role,
            }

            const accessToken = this.tokenService.generateAccessToken(payload)
            const refreshToken = await this.tokenService.generateRefreshToken(
                payload,
                user,
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
                id: user.id,
            })
        } catch (e) {
            next(e)
        }
    }

    async login(req: LoginUserRequest, res: Response, next: NextFunction) {
        const { email, password } = req.body

        const result = validationResult(req)
        if (!result.isEmpty()) {
            return res.status(400).json({
                errors: result.array(),
            })
        }

        this.logger.debug("New request to login a user", {
            email,
            password: "*",
        })

        try {
            const user = await this.userService.findByEmail(email)

            if (!user) {
                const error = createHttpError(
                    400,
                    "Email or password does not match!",
                )
                next(error)
                return
            }

            const passwordMatch = await this.credentialService.comparePassword(
                password,
                user.password,
            )

            if (!passwordMatch) {
                const error = createHttpError(
                    400,
                    "Email or password does not match!",
                )
                next(error)
                return
            }

            this.logger.info("User has been logged in", { id: user.id })

            const payload: JwtPayload = {
                sub: user.id.toString(),
                role: user.role,
            }

            const accessToken = this.tokenService.generateAccessToken(payload)
            const refreshToken = await this.tokenService.generateRefreshToken(
                payload,
                user,
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

            res.status(200).json({
                id: user.id,
            })
        } catch (e) {
            next(e)
        }
    }

    async self(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const user = await this.userService.findById(Number(req.auth?.sub))
            res.status(200).json({
                ...user,
                password: undefined,
            })
        } catch (e) {
            next(e)
        }
    }

    async refresh(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            const payload: JwtPayload = {
                sub: req.auth?.sub.toString(),
                role: req.auth?.role,
            }

            const accessToken = this.tokenService.generateAccessToken(payload)

            const user = await this.userService.findById(Number(req.auth?.sub))

            if (!user) {
                const error = createHttpError(
                    400,
                    "User with the token could not be found",
                )
                next(error)
                return
            }

            const refreshToken = await this.tokenService.generateRefreshToken(
                payload,
                user,
            )

            await this.tokenService.deleteRefreshToken(Number(req.auth?.jti))

            this.logger.info("Refresh token has been rotated", { id: user.id })

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

            res.status(200).json({
                id: user.id,
            })
        } catch (e) {
            next(e)
        }
    }

    async logout(req: AuthRequest, res: Response, next: NextFunction) {
        try {
            await this.tokenService.deleteRefreshToken(Number(req.auth?.jti))
            this.logger.info("Refresh token has been deleted", {
                id: req.auth?.jti,
            })
            this.logger.info("User has been logged out", { id: req.auth?.sub })

            // Options must match those used when the cookies were set,
            // otherwise the browser will not remove them.
            res.clearCookie("accessToken", {
                domain: "localhost",
                sameSite: "strict",
                httpOnly: true,
            })
            res.clearCookie("refreshToken", {
                domain: "localhost",
                sameSite: "strict",
                httpOnly: true,
            })

            return res.json({})
        } catch (e) {
            next(e)
        }
    }
}
