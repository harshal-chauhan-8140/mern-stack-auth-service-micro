import express from "express"
import AuthController from "../controllers/AuthController.ts"
import { UserService } from "../services/UserService.ts"
import { AppDataSource } from "../data-source.ts"
import { User } from "../entities/User.ts"
import logger from "../config/logger.ts"
import registerValidator from "../validators/registerValidator.ts"
import { TokenService } from "../services/TokenService.ts"
import { RefreshToken } from "../entities/RefreshToken.ts"
const router = express.Router()

const userRepository = AppDataSource.getRepository(User)
const tokenRepository = AppDataSource.getRepository(RefreshToken)
const userService = new UserService(userRepository)
const tokenService = new TokenService(tokenRepository)
const authController = new AuthController(userService, tokenService, logger)

router.post(
    "/register",
    registerValidator,
    authController.register.bind(authController),
)

export default router
