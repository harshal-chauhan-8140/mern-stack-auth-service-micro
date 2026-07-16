import express from "express"
import { TenantController } from "../controllers/TenantController.ts"
import { TenantService } from "../services/TenantService.ts"
import { AppDataSource } from "../config/data-source.ts"
import { Tenant } from "../entities/Tenant.ts"
import logger from "../config/logger.ts"
import authenticate from "../middlewares/authenticate.ts"

const router = express.Router()

const tenantRepository = AppDataSource.getRepository(Tenant)
const tenantService = new TenantService(tenantRepository, logger)
const tenantController = new TenantController(tenantService, logger)

router.post("/", authenticate, tenantController.create.bind(tenantController))

export default router
