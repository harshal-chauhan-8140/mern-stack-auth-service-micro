import app from "./app.ts"
import { config } from "./config/index.ts"
import logger from "./config/logger.ts"

function startServer() {
    app.listen(config.port, () => {
        logger.info(
            `Server is running on port ${config.port} in ${config.env} mode`,
        )
    })
}

startServer()
