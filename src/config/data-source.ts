import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from "../entities/User.ts"
import { config } from "./index.ts"
import { RefreshToken } from "../entities/RefreshToken.ts"
import { Tenant } from "../entities/Tenant.ts"
import { Init1784208333985 } from "../migration/1784208333985-init.ts"
import { AddForiegnKeyTenantIdInUsersTable1784208864968 } from "../migration/1784208864968-add_foriegn_key_tenantId_in_users_table.ts"

export const AppDataSource = new DataSource({
    type: "postgres",
    host: config.DB_HOST,
    port: Number(config.DB_PORT),
    username: config.DB_USERNAME,
    password: config.DB_PASSWORD,
    database: config.DB_NAME,
    synchronize: false,
    logging: false,
    entities: [User, RefreshToken, Tenant],
    migrations:
        config.NODE_ENV === "test"
            ? []
            : [
                  Init1784208333985,
                  AddForiegnKeyTenantIdInUsersTable1784208864968,
              ],
    subscribers: [],
})
