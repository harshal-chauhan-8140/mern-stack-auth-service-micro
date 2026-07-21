import app from "./app.ts"
import { config } from "./config/index.ts"
import logger from "./config/logger.ts"
import { AppDataSource } from "./config/data-source.ts"
import { seedAdminUser } from "./config/seedAdmin.ts"

const startServer = async () => {
    try {
        await AppDataSource.initialize()
        logger.info("Database connected successfully")

        await seedAdminUser()

        app.listen(config.PORT, () => {
            logger.info(
                `Server is running on port ${config.PORT} in ${config.NODE_ENV} mode`,
            )
        })
    } catch (err: unknown) {
        console.log(err)
        if (err instanceof Error) {
            logger.error(err.message)
            setTimeout(() => {
                process.exit(1)
            }, 1000)
        }
    }
}

startServer()
