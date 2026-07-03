import app from "./app.ts"
import { config } from "./config/index.ts"
import logger from "./config/logger.ts"

function startServer() {
    app.listen(config.PORT, () => {
        logger.info(
            `Server is running on port ${config.PORT} in ${config.NODE_ENV} mode`,
        )
    })
}

startServer()
