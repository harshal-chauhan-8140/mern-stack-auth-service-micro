import type { Response, NextFunction } from "express"
import type { TenantRequest } from "../types/index.ts"
import createHttpError from "http-errors"

export const canAccess = (roles: string[] = []) => {
    return (req: TenantRequest, res: Response, next: NextFunction) => {
        const role = req.auth?.role

        if (role && roles.includes(role)) {
            return next()
        }

        const error = createHttpError(
            403,
            "You don't have permission to create tenant",
        )
        return next(error)
    }
}
