import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from "../entities/User.ts"
import { config } from "./index.ts"
import { RefreshToken } from "../entities/RefreshToken.ts"
import { Tenant } from "../entities/Tenant.ts"
import { Init1784208333985 } from "../migration/1784208333985-init.ts"

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
    migrations: [Init1784208333985],
    subscribers: [],
})
