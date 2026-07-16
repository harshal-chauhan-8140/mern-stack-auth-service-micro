import type { Response, NextFunction } from "express"
import type { Logger } from "winston"
import type { TenantRequest } from "../types/index.ts"
import type { TenantService } from "../services/TenantService.ts"

export class TenantController {
    constructor(
        private tenantService: TenantService,
        private logger: Logger,
    ) {}

    async create(req: TenantRequest, res: Response, next: NextFunction) {
        const { name, address } = req.body

        this.logger.debug("New request to create a tenant", { name, address })

        try {
            const tenant = await this.tenantService.create(name, address)

            this.logger.info("Tenant has been created", { id: tenant.id })

            return res.status(201).json({
                id: tenant.id,
                name: tenant.name,
                address: tenant.address,
            })
        } catch (err) {
            return next(err)
        }
    }
}
