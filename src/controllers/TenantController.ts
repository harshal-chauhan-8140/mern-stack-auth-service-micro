import type { Request, Response, NextFunction } from "express"
import type { Logger } from "winston"
import type { TenantRequest } from "../types/index.ts"
import type { TenantService } from "../services/TenantService.ts"
import { validationResult } from "express-validator"
import createHttpError from "http-errors"

export class TenantController {
    constructor(
        private tenantService: TenantService,
        private logger: Logger,
    ) {}

    async create(req: TenantRequest, res: Response, next: NextFunction) {
        const result = validationResult(req)
        if (!result.isEmpty()) {
            return res.status(400).json({
                errors: result.array(),
            })
        }

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

    async update(req: TenantRequest, res: Response, next: NextFunction) {
        const result = validationResult(req)
        if (!result.isEmpty()) {
            return res.status(400).json({
                errors: result.array(),
            })
        }

        const { name, address } = req.body
        const tenantId = req.params.id

        if (isNaN(Number(tenantId))) {
            return next(createHttpError(400, "Invalid url param."))
        }

        this.logger.debug("New request to update a tenant", {
            id: tenantId,
            name,
            address,
        })

        try {
            const tenant = await this.tenantService.findById(Number(tenantId))

            if (!tenant) {
                return next(createHttpError(404, "Tenant does not exist."))
            }

            await this.tenantService.update(Number(tenantId), name, address)

            this.logger.info("Tenant has been updated", { id: tenantId })

            return res.json({ id: Number(tenantId) })
        } catch (err) {
            return next(err)
        }
    }

    async getAll(req: Request, res: Response, next: NextFunction) {
        try {
            const tenants = await this.tenantService.findAll()

            this.logger.info("All tenants have been fetched")

            return res.json(tenants)
        } catch (err) {
            return next(err)
        }
    }

    async getOne(req: Request, res: Response, next: NextFunction) {
        const tenantId = req.params.id

        if (isNaN(Number(tenantId))) {
            return next(createHttpError(400, "Invalid url param."))
        }

        try {
            const tenant = await this.tenantService.findById(Number(tenantId))

            if (!tenant) {
                return next(createHttpError(404, "Tenant does not exist."))
            }

            this.logger.info("Tenant has been fetched", { id: tenantId })

            return res.json(tenant)
        } catch (err) {
            return next(err)
        }
    }

    async destroy(req: Request, res: Response, next: NextFunction) {
        const tenantId = req.params.id

        if (isNaN(Number(tenantId))) {
            return next(createHttpError(400, "Invalid url param."))
        }

        try {
            const tenant = await this.tenantService.findById(Number(tenantId))

            if (!tenant) {
                return next(createHttpError(404, "Tenant does not exist."))
            }

            await this.tenantService.deleteById(Number(tenantId))

            this.logger.info("Tenant has been deleted", { id: tenantId })

            return res.json({ id: Number(tenantId) })
        } catch (err) {
            return next(err)
        }
    }
}
