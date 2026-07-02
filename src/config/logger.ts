import winston from 'winston'
import { config } from './index.ts'
const logger = winston.createLogger({
    level: 'info',
    defaultMeta: { service: 'auth-service', env: config.env as string },
    transports: [
        new winston.transports.File({
            level: 'error',
            dirname: 'logs',
            filename: 'error.log',
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple(),
                winston.format.timestamp(),
            ),
            silent: config.env === 'test',
        }),
        new winston.transports.File({
            level: 'info',
            dirname: 'logs',
            filename: 'combined.log',
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple(),
                winston.format.timestamp(),
            ),
            silent: config.env === 'test',
        }),
        new winston.transports.Console({
            level: 'info',
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple(),
                winston.format.timestamp(),
            ),
            silent: config.env === 'test',
        }),
    ],
})

export default logger
