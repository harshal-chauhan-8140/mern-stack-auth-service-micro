import { checkSchema } from "express-validator"

export default checkSchema({
    name: {
        trim: true,
        errorMessage: "Tenant name is required!",
        notEmpty: true,
        isLength: {
            options: {
                max: 30,
            },
            errorMessage: "Tenant name should not exceed 30 chars!",
        },
    },
    address: {
        trim: true,
        errorMessage: "Tenant address is required!",
        notEmpty: true,
        isLength: {
            options: {
                max: 255,
            },
            errorMessage: "Tenant address should not exceed 255 chars!",
        },
    },
})
