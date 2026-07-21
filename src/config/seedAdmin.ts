import bcrypt from "bcrypt"
import type { EntityManager } from "typeorm"
import { AppDataSource } from "./data-source.ts"
import { config } from "./index.ts"
import logger from "./logger.ts"
import { User } from "../entities/User.ts"
import { Roles } from "../constants/index.ts"

const ADMIN_SEED_LOCK_KEY = 4041

const SALT_ROUNDS = 10

export const seedAdminUser = async (): Promise<void> => {
    const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_FIRST_NAME, ADMIN_LAST_NAME } =
        config

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
        logger.warn(
            "ADMIN_EMAIL / ADMIN_PASSWORD are not configured. Skipping admin user creation.",
        )
        return
    }

    try {
        await AppDataSource.transaction(async (manager: EntityManager) => {
            await manager.query("SELECT pg_advisory_xact_lock($1)", [
                ADMIN_SEED_LOCK_KEY,
            ])

            const userRepository = manager.getRepository(User)

            const existingAdmin = await userRepository.findOne({
                where: { email: ADMIN_EMAIL },
            })

            if (existingAdmin) {
                logger.info(
                    "Admin user already exists. Skipping admin user creation.",
                )
                return
            }

            const hashedPassword = await bcrypt.hash(
                ADMIN_PASSWORD,
                SALT_ROUNDS,
            )

            await userRepository.save({
                firstName: ADMIN_FIRST_NAME,
                lastName: ADMIN_LAST_NAME,
                email: ADMIN_EMAIL,
                password: hashedPassword,
                role: Roles.ADMIN,
            })

            logger.info(`Admin user created successfully (${ADMIN_EMAIL}).`)
        })
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        logger.error(`Failed to seed admin user: ${message}`)
    }
}
