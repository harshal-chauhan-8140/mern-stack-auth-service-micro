import type { Repository } from "typeorm"
import type { Tenant } from "../entities/Tenant.ts"
import type { Logger } from "winston"

export class TenantService {
    constructor(
        private tenantRepository: Repository<Tenant>,
        private logger: Logger,
    ) {}

    async create(name: string, address: string) {
        this.logger.debug("Storing a tenant in the database", { name, address })

        const tenant = await this.tenantRepository.save({
            name,
            address,
        })

        this.logger.info("Tenant has been stored in the database", {
            id: tenant.id,
        })

        return tenant
    }

    async update(id: number, name: string, address: string) {
        this.logger.debug("Updating a tenant in the database", {
            id,
            name,
            address,
        })

        return await this.tenantRepository.update(id, {
            name,
            address,
        })
    }

    async findAll() {
        this.logger.debug("Fetching all tenants from the database")

        return await this.tenantRepository.find()
    }

    async findById(id: number) {
        this.logger.debug("Fetching a tenant from the database", { id })

        return await this.tenantRepository.findOne({
            where: {
                id: id,
            },
        })
    }

    async deleteById(id: number) {
        this.logger.debug("Deleting a tenant from the database", { id })

        return await this.tenantRepository.delete(id)
    }
}
