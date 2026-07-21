import { DataSource } from "typeorm"
import bcrypt from "bcrypt"
import { AppDataSource } from "../../src/config/data-source"
import { seedAdminUser } from "../../src/config/seedAdmin"
import { config } from "../../src/config"
import { User } from "../../src/entities/User"
import { Roles } from "../../src/constants"

describe("seedAdminUser", () => {
    let connection: DataSource

    beforeAll(async () => {
        connection = await AppDataSource.initialize()
    })

    beforeEach(async () => {
        await connection.dropDatabase()
        await connection.synchronize()
    })

    afterAll(async () => {
        await connection.destroy()
    })

    it("should create an admin user with the admin role", async () => {
        await seedAdminUser()

        const userRepository = connection.getRepository(User)
        const users = await userRepository.find()

        expect(users).toHaveLength(1)
        expect(users[0].email).toBe(config.ADMIN_EMAIL)
        expect(users[0].role).toBe(Roles.ADMIN)
    })

    it("should store the admin password hashed, never in plaintext", async () => {
        await seedAdminUser()

        const userRepository = connection.getRepository(User)
        const users = await userRepository.find()

        expect(users[0].password).not.toBe(config.ADMIN_PASSWORD)
        const matches = await bcrypt.compare(
            config.ADMIN_PASSWORD as string,
            users[0].password,
        )
        expect(matches).toBe(true)
    })

    it("should not create a duplicate admin when run repeatedly", async () => {
        await seedAdminUser()
        await seedAdminUser()
        await seedAdminUser()

        const userRepository = connection.getRepository(User)
        const admins = await userRepository.find({
            where: { role: Roles.ADMIN },
        })

        expect(admins).toHaveLength(1)
    })

    it("should not create a duplicate admin under concurrent startups", async () => {
        await Promise.all([
            seedAdminUser(),
            seedAdminUser(),
            seedAdminUser(),
            seedAdminUser(),
        ])

        const userRepository = connection.getRepository(User)
        const admins = await userRepository.find({
            where: { role: Roles.ADMIN },
        })

        expect(admins).toHaveLength(1)
    })
})
