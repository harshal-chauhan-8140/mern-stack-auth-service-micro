import { Brackets, type Repository } from "typeorm"
import { User } from "../entities/User.ts"
import createHttpError from "http-errors"
import { Roles } from "../constants/index.ts"
import bcrypt from "bcrypt"
import type { UserQueryParams } from "../types/index.ts"

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
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                password: true,
            },
            relations: {
                tenant: true,
            },
        })
    }

    async findById(id: number) {
        return await this.userRepository.findOne({
            where: {
                id: Number(id),
            },
            relations: {
                tenant: true,
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

    async findAll(validatedQuery: UserQueryParams) {
        const queryBuilder = this.userRepository.createQueryBuilder("user")

        if (validatedQuery.q) {
            const searchTerm = `%${validatedQuery.q}%`
            queryBuilder.where(
                new Brackets((qb) => {
                    qb.where(
                        "CONCAT(user.firstName, ' ', user.lastName) ILike :q",
                        { q: searchTerm },
                    ).orWhere("user.email ILike :q", { q: searchTerm })
                }),
            )
        }

        if (validatedQuery.role) {
            queryBuilder.andWhere("user.role = :role", {
                role: validatedQuery.role,
            })
        }

        return await queryBuilder
            .leftJoinAndSelect("user.tenant", "tenant")
            .skip((validatedQuery.currentPage - 1) * validatedQuery.perPage)
            .take(validatedQuery.perPage)
            .orderBy("user.id", "DESC")
            .getManyAndCount()
    }

    async deleteById(id: number) {
        return await this.userRepository.delete(id)
    }
}
