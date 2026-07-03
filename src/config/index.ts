import { config as dotenvConfig } from "dotenv"

dotenvConfig()

const { PORT, NODE_ENV } = process.env

export const config = {
    port: PORT,
    env: NODE_ENV,
}
