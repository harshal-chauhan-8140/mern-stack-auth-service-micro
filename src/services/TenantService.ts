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
}
