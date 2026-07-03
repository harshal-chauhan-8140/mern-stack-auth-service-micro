import { type Request, type Response } from "express"

export default class AuthController {
    register(req: Request, res: Response) {
        res.status(201).json({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
        })
    }
}
