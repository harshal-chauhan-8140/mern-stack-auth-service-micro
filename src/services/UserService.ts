import type { Repository } from "typeorm"
import { User } from "../entities/User.ts"
import createHttpError from "http-errors"
import { Roles } from "../constants/index.ts"
import bcrypt from "bcrypt"

export class UserService {
    // userRepository: Repository<User>;

    //another syntax
    constructor(private userRepository: Repository<User>) {
        // this.userRepository = userRepository;
    }

    async create(
        firstName: string,
        lastName: string,
        email: string,
        password: string,
        role: string = Roles.CUSTOMER,
    ) {
        const user = await this.userRepository.findOne({
            where: {
                email: email,
            },
        })
        if (user) {
            const err = createHttpError(400, "Email already exist")
            throw err
        }

        const saltRound = 10
        const hashedPassword = await bcrypt.hash(password, saltRound)

        try {
            return await this.userRepository.save({
                firstName,
                lastName,
                email,
                password: hashedPassword,
                role,
            })
        } catch {
            const error = createHttpError(
                500,
                "Failed to store data in database",
            )
            throw error
        }
    }

    async findByEmail(email: string) {
        return await this.userRepository.findOne({
            where: {
                email: email,
            },
        })
    }

    async findById(id: number) {
        return await this.userRepository.findOne({
            where: {
                id: Number(id),
            },
        })
    }

    async update(
        id: number,
        firstName: string,
        lastName: string,
        role: string,
    ) {
        try {
            return await this.userRepository.update(id, {
                firstName,
                lastName,
                role,
            })
        } catch {
            const error = createHttpError(
                500,
                "Failed to update the user in database",
            )
            throw error
        }
    }

    async findAll() {
        return await this.userRepository.find({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
            },
        })
    }

    async deleteById(id: number) {
        return await this.userRepository.delete(id)
    }
}
