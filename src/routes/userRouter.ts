import express from "express"
import { AppDataSource } from "../config/data-source.ts"
import authenticate from "../middlewares/authenticate.ts"
import { canAccess } from "../middlewares/CanAccess.ts"
import { Roles } from "../constants/index.ts"
import { User } from "../entities/User.ts"
import { UserController } from "../controllers/UserController.ts"
import { UserService } from "../services/UserService.ts"
import createUserValidator from "../validators/createUserValidator.ts"
import updateUserValidator from "../validators/updateUserValidator.ts"

const router = express.Router()

const userRepository = AppDataSource.getRepository(User)
const userService = new UserService(userRepository)
const userController = new UserController(userService)

router.post(
    "/",
    authenticate,
    canAccess([Roles.ADMIN]),
    createUserValidator,
    userController.create.bind(userController),
)

router.patch(
    "/:id",
    authenticate,
    canAccess([Roles.ADMIN]),
    updateUserValidator,
    userController.update.bind(userController),
)

router.get(
    "/",
    authenticate,
    canAccess([Roles.ADMIN]),
    userController.getAll.bind(userController),
)

router.get(
    "/:id",
    authenticate,
    canAccess([Roles.ADMIN]),
    userController.getOne.bind(userController),
)

router.delete(
    "/:id",
    authenticate,
    canAccess([Roles.ADMIN]),
    userController.destroy.bind(userController),
)

export default router
