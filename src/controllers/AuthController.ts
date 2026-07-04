import { type NextFunction, type Response } from "express"
import type { RegisterUserRequest } from "../types/index.ts"
import { UserService } from "../services/UserService.ts"
import type { Logger } from "winston"

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
