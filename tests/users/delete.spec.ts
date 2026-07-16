import request from "supertest"
import app from "../../src/app"
import { DataSource, Repository } from "typeorm"
import { AppDataSource } from "../../src/config/data-source"
import { User } from "../../src/entities/User"
import { Roles } from "../../src/constants"
import * as jwksModule from "mock-jwks"
import type { JWKSMock } from "mock-jwks"

type CreateJWKMock = (host: string, path?: string) => JWKSMock

const jwksExport = jwksModule as unknown as {
    default: CreateJWKMock | { default: CreateJWKMock }
}

const createJWKMock: CreateJWKMock =
    typeof jwksExport.default === "function"
        ? jwksExport.default
        : jwksExport.default.default

describe("DELETE /users/:id", () => {
    let connection: DataSource
    let userRepository: Repository<User>
    let jwks: ReturnType<typeof createJWKMock>

    const userData = {
        firstName: "harshal",
        lastName: "chauhan",
        email: "harshal@gmail.com",
        password: "1234567890",
        role: Roles.CUSTOMER,
    }

    beforeAll(async () => {
        jwks = createJWKMock("http://localhost:5501")
        connection = await AppDataSource.initialize()
        userRepository = connection.getRepository(User)
    })

    beforeEach(async () => {
        jwks.start()
        await connection.dropDatabase()
        await connection.synchronize()
    })

    afterEach(() => {
        jwks.stop()
    })

    afterAll(async () => {
        await connection.destroy()
    })

    describe("given an admin user", () => {
        it("should return 200 status code", async () => {
            const user = await userRepository.save({ ...userData })

            const adminAccessToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .delete(`/users/${user.id}`)
                .set("Cookie", [`accessToken=${adminAccessToken}`])
                .send()

            expect(response.statusCode).toBe(200)
        })

        it("should remove the user from the database", async () => {
            const user = await userRepository.save({ ...userData })

            const adminAccessToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            await request(app)
                .delete(`/users/${user.id}`)
                .set("Cookie", [`accessToken=${adminAccessToken}`])
                .send()

            const users = await userRepository.find()

            expect(users).toHaveLength(0)
        })

        it("should only remove the requested user", async () => {
            const user = await userRepository.save({ ...userData })
            await userRepository.save({
                ...userData,
                email: "other@gmail.com",
            })

            const adminAccessToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            await request(app)
                .delete(`/users/${user.id}`)
                .set("Cookie", [`accessToken=${adminAccessToken}`])
                .send()

            const users = await userRepository.find()

            expect(users).toHaveLength(1)
            expect(users[0].email).toBe("other@gmail.com")
        })

        it("should return the id of the deleted user", async () => {
            const user = await userRepository.save({ ...userData })

            const adminAccessToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .delete(`/users/${user.id}`)
                .set("Cookie", [`accessToken=${adminAccessToken}`])
                .send()

            expect((response.body as Record<string, number>).id).toBe(user.id)
        })

        it("should return 400 if the id param is not a number", async () => {
            const adminAccessToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .delete("/users/abc")
                .set("Cookie", [`accessToken=${adminAccessToken}`])
                .send()

            expect(response.statusCode).toBe(400)
        })

        it("should return 404 if the user does not exist", async () => {
            const adminAccessToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .delete("/users/999")
                .set("Cookie", [`accessToken=${adminAccessToken}`])
                .send()

            expect(response.statusCode).toBe(404)
        })
    })

    describe("given a non admin user", () => {
        it("should return 401 if user is not authenticated", async () => {
            const user = await userRepository.save({ ...userData })

            const response = await request(app)
                .delete(`/users/${user.id}`)
                .send()

            expect(response.statusCode).toBe(401)

            const users = await userRepository.find()

            expect(users).toHaveLength(1)
        })

        it("should return 403 if user is not admin", async () => {
            const user = await userRepository.save({ ...userData })

            const managerAccessToken = jwks.token({
                sub: "1",
                role: Roles.MANAGER,
            })

            const response = await request(app)
                .delete(`/users/${user.id}`)
                .set("Cookie", [`accessToken=${managerAccessToken}`])
                .send()

            expect(response.statusCode).toBe(403)

            const users = await userRepository.find()

            expect(users).toHaveLength(1)
        })
    })
})
