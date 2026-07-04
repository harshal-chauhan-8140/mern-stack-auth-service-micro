import express from "express"
import AuthController from "../controllers/AuthController.ts"
import { UserService } from "../services/UserService.ts"
import { AppDataSource } from "../data-source.ts"
import { User } from "../entities/User.ts"
import logger from "../config/logger.ts"
import registerValidator from "../validators/registerValidator.ts"
const router = express.Router()

const userRepository = AppDataSource.getRepository(User)
const userService = new UserService(userRepository)
const authController = new AuthController(userService, logger)

router.post(
    "/register",
    registerValidator,
    authController.register.bind(authController),
)

export default router
