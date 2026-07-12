import bcrypt from "bcrypt"

export class CredentialService {
    async comparePassword(password: string, hashPassword: string) {
        return bcrypt.compare(password, hashPassword)
    }
}
