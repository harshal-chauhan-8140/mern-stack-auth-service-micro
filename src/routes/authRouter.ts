import express from "express"
import AuthController from "../controllers/AuthController.ts"
import { UserService } from "../services/UserService.ts"
import { AppDataSource } from "../data-source.ts"
import { User } from "../entities/User.ts"
import logger from "../config/logger.ts"
import registerValidator from "../validators/registerValidator.ts"
import { TokenService } from "../services/TokenService.ts"
import { RefreshToken } from "../entities/RefreshToken.ts"
import loginValidator from "../validators/loginValidator.ts"
import { CredentialService } from "../services/CredentialService.ts"
import authenticate from "../middlewares/authenticate.ts"
const router = express.Router()

const userRepository = AppDataSource.getRepository(User)
const tokenRepository = AppDataSource.getRepository(RefreshToken)
const userService = new UserService(userRepository)
const tokenService = new TokenService(tokenRepository)
const credentialService = new CredentialService()
const authController = new AuthController(
    userService,
    tokenService,
    credentialService,
    logger,
)

router.post(
    "/register",
    registerValidator,
    authController.register.bind(authController),
)

router.post("/login", loginValidator, authController.login.bind(authController))

router.get("/self", authenticate, authController.self.bind(authController))

export default router
