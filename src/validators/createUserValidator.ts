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
    email: {
        trim: true,
        errorMessage: "Email is required!",
        notEmpty: true,
        isEmail: {
            errorMessage: "Email should be a valid email",
        },
    },
    password: {
        trim: true,
        errorMessage: "Password is required!",
        notEmpty: true,
        isLength: {
            options: {
                min: 8,
            },
            errorMessage: "Password length should be at least 8 chars!",
        },
    },
    role: {
        optional: true,
        trim: true,
        isIn: {
            options: [[Roles.CUSTOMER, Roles.ADMIN, Roles.MANAGER]],
            errorMessage: "Role should be a valid role",
        },
    },
})
