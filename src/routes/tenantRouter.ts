import express, { type Request, type Response } from "express"

const router = express.Router()

router.post("/", (req: Request, res: Response) => {
    return res.status(201).json()
})

export default router
