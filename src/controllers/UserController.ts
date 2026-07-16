import type { Response, NextFunction } from "express"
import type { UserService } from "../services/UserService.ts"
import type { CreateUserRequest } from "../types/index.ts"

export class UserController {
    constructor(private userService: UserService) {}

    async create(req: CreateUserRequest, res: Response, next: NextFunction) {
        const { firstName, lastName, email, password, role } = req.body

        try {
            const user = await this.userService.create(
                firstName,
                lastName,
                email,
                password,
                role,
            )

            return res.status(201).json({
                id: user.id,
            })
        } catch (err) {
            return next(err)
        }
    }
}
