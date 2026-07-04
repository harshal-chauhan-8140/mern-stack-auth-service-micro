import type { Repository } from "typeorm"
import { User } from "../entities/User.ts"
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
        await this.userRepository.save({
            firstName,
            lastName,
            email,
            password,
        })
    }
}
