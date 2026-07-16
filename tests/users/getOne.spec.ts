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

describe("GET /users/:id", () => {
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
                .get(`/users/${user.id}`)
                .set("Cookie", [`accessToken=${adminAccessToken}`])
                .send()

            expect(response.statusCode).toBe(200)
        })

        it("should return the user data", async () => {
            const user = await userRepository.save({ ...userData })

            const adminAccessToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .get(`/users/${user.id}`)
                .set("Cookie", [`accessToken=${adminAccessToken}`])
                .send()

            const body = response.body as User

            expect(body.id).toBe(user.id)
            expect(body.email).toBe(userData.email)
            expect(body.firstName).toBe(userData.firstName)
        })

        it("should not return the password field", async () => {
            const user = await userRepository.save({ ...userData })

            const adminAccessToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .get(`/users/${user.id}`)
                .set("Cookie", [`accessToken=${adminAccessToken}`])
                .send()

            expect(response.body as User).not.toHaveProperty("password")
        })

        it("should return the requested user when many exist", async () => {
            await userRepository.save({
                ...userData,
                email: "other@gmail.com",
            })
            const user = await userRepository.save({ ...userData })

            const adminAccessToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .get(`/users/${user.id}`)
                .set("Cookie", [`accessToken=${adminAccessToken}`])
                .send()

            expect((response.body as User).email).toBe(userData.email)
        })

        it("should return 400 if the id param is not a number", async () => {
            const adminAccessToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .get("/users/abc")
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
                .get("/users/999")
                .set("Cookie", [`accessToken=${adminAccessToken}`])
                .send()

            expect(response.statusCode).toBe(404)
        })
    })

    describe("given a non admin user", () => {
        it("should return 401 if user is not authenticated", async () => {
            const user = await userRepository.save({ ...userData })

            const response = await request(app).get(`/users/${user.id}`).send()

            expect(response.statusCode).toBe(401)
        })

        it("should return 403 if user is not admin", async () => {
            const user = await userRepository.save({ ...userData })

            const managerAccessToken = jwks.token({
                sub: "1",
                role: Roles.MANAGER,
            })

            const response = await request(app)
                .get(`/users/${user.id}`)
                .set("Cookie", [`accessToken=${managerAccessToken}`])
                .send()

            expect(response.statusCode).toBe(403)
        })
    })
})
