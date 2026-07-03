import "reflect-metadata"
import express, {
    type NextFunction,
    type Request,
    type Response,
} from "express"
import logger from "./config/logger.ts"
import { HttpError } from "http-errors"
import authRouter from "./routes/auth.ts"

const app = express()
app.use(express.json())

app.get("/", (req, res) => {
    res.status(200).json({
        msg: "Welcome to the API",
    })
})

app.use("/auth", authRouter)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.message)
    const statusCode = err.statusCode || 500

    res.status(statusCode).json({
        errors: [
            {
                type: err.name,
                msg: err.message,
                path: "",
                location: "",
            },
        ],
    })
})

export default app
