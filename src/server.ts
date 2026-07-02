import app from './app.ts'
import { config } from './config/index.ts'

function startServer() {
    app.listen(config.port, () => {
        console.log(
            `Server is running on port ${config.port} in ${config.env} mode`,
        )
    })
}

startServer()
