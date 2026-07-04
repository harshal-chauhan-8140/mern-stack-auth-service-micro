import type { Repository } from "typeorm"
import { User } from "../entities/User.ts"
import createHttpError from "http-errors"
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
    ) {
        try {
            return await this.userRepository.save({
                firstName,
                lastName,
                email,
                password,
            })
        } catch {
            const error = createHttpError(
                500,
                "Failed to store data in database",
            )
            throw error
        }
    }
}
