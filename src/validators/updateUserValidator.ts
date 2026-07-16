import { checkSchema } from "express-validator"
import { Roles } from "../constants/index.ts"

export default checkSchema({
    firstName: {
        errorMessage: "First name is required!",
        notEmpty: true,
        trim: true,
    },
    lastName: {
        errorMessage: "Last name is required!",
        notEmpty: true,
        trim: true,
    },
    role: {
        errorMessage: "Role is required!",
        notEmpty: true,
        trim: true,
        isIn: {
            options: [[Roles.CUSTOMER, Roles.ADMIN, Roles.MANAGER]],
            errorMessage: "Role should be a valid role",
        },
    },
})
