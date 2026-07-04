import express from "express"
import AuthController from "../controllers/AuthController.ts"
import { UserService } from "../services/UserService.ts"
import { AppDataSource } from "../data-source.ts"
import { User } from "../entities/User.ts"
const router = express.Router()

const repository = AppDataSource.getRepository(User)
const userService = new UserService(repository)
const authController = new AuthController(userService)

router.post("/register", authController.register.bind(authController))

export default router
