import express from "express"
import { AppDataSource } from "../config/data-source.ts"
import authenticate from "../middlewares/authenticate.ts"
import { canAccess } from "../middlewares/CanAccess.ts"
import { Roles } from "../constants/index.ts"
import { User } from "../entities/User.ts"
import { UserController } from "../controllers/UserController.ts"
import { UserService } from "../services/UserService.ts"

const router = express.Router()

const userRepository = AppDataSource.getRepository(User)
const userService = new UserService(userRepository)
const userController = new UserController(userService)

router.post(
    "/",
    authenticate,
    canAccess([Roles.ADMIN]),
    userController.create.bind(userController),
)

export default router
