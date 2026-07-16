import express from "express"
import { TenantController } from "../controllers/TenantController.ts"
import { TenantService } from "../services/TenantService.ts"
import { AppDataSource } from "../config/data-source.ts"
import { Tenant } from "../entities/Tenant.ts"
import logger from "../config/logger.ts"
import authenticate from "../middlewares/authenticate.ts"
import { canAccess } from "../middlewares/CanAccess.ts"
import { Roles } from "../constants/index.ts"
import tenantValidator from "../validators/tenantValidator.ts"

const router = express.Router()

const tenantRepository = AppDataSource.getRepository(Tenant)
const tenantService = new TenantService(tenantRepository, logger)
const tenantController = new TenantController(tenantService, logger)

router.post(
    "/",
    authenticate,
    canAccess([Roles.ADMIN]),
    tenantValidator,
    tenantController.create.bind(tenantController),
)

router.patch(
    "/:id",
    authenticate,
    canAccess([Roles.ADMIN]),
    tenantValidator,
    tenantController.update.bind(tenantController),
)

router.get(
    "/",
    authenticate,
    canAccess([Roles.ADMIN]),
    tenantController.getAll.bind(tenantController),
)

router.get(
    "/:id",
    authenticate,
    canAccess([Roles.ADMIN]),
    tenantController.getOne.bind(tenantController),
)

router.delete(
    "/:id",
    authenticate,
    canAccess([Roles.ADMIN]),
    tenantController.destroy.bind(tenantController),
)

export default router
