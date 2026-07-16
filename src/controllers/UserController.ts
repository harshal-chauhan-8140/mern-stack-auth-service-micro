import type { Request, Response, NextFunction } from "express"
import type { UserService } from "../services/UserService.ts"
import type { CreateUserRequest, UpdateUserRequest } from "../types/index.ts"
import { validationResult } from "express-validator"
import createHttpError from "http-errors"

export class UserController {
    constructor(private userService: UserService) {}

    async create(req: CreateUserRequest, res: Response, next: NextFunction) {
        const result = validationResult(req)
        if (!result.isEmpty()) {
            return res.status(400).json({
                errors: result.array(),
            })
        }

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

    async update(req: UpdateUserRequest, res: Response, next: NextFunction) {
        const result = validationResult(req)
        if (!result.isEmpty()) {
            return res.status(400).json({
                errors: result.array(),
            })
        }

        const { firstName, lastName, role } = req.body
        const userId = req.params.id

        if (isNaN(Number(userId))) {
            return next(createHttpError(400, "Invalid url param."))
        }

        try {
            const user = await this.userService.findById(Number(userId))

            if (!user) {
                return next(createHttpError(404, "User does not exist."))
            }

            await this.userService.update(
                Number(userId),
                firstName,
                lastName,
                role,
            )

            return res.json({ id: Number(userId) })
        } catch (err) {
            return next(err)
        }
    }

    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const users = await this.userService.findAll()

            return res.json(users)
        } catch (err) {
            return next(err)
        }
    }

    async getOne(req: Request, res: Response, next: NextFunction) {
        const userId = req.params.id

        if (isNaN(Number(userId))) {
            return next(createHttpError(400, "Invalid url param."))
        }

        try {
            const user = await this.userService.findById(Number(userId))

            if (!user) {
                return next(createHttpError(404, "User does not exist."))
            }

            return res.json({
                ...user,
                password: undefined,
            })
        } catch (err) {
            return next(err)
        }
    }

    async destroy(req: Request, res: Response, next: NextFunction) {
        const userId = req.params.id

        if (isNaN(Number(userId))) {
            return next(createHttpError(400, "Invalid url param."))
        }

        try {
            const user = await this.userService.findById(Number(userId))

            if (!user) {
                return next(createHttpError(404, "User does not exist."))
            }

            await this.userService.deleteById(Number(userId))

            return res.json({ id: Number(userId) })
        } catch (err) {
            return next(err)
        }
    }
}
