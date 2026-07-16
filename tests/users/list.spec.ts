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

describe("GET /users", () => {
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
            const adminAccessToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .get("/users")
                .set("Cookie", [`accessToken=${adminAccessToken}`])
                .send()

            expect(response.statusCode).toBe(200)
        })

        it("should return all the users", async () => {
            await userRepository.save([
                { ...userData, email: "first@gmail.com" },
                { ...userData, email: "second@gmail.com" },
            ])

            const adminAccessToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .get("/users")
                .set("Cookie", [`accessToken=${adminAccessToken}`])
                .send()

            const users = response.body as User[]

            expect(users).toHaveLength(2)
            expect(users[0].email).toBe("first@gmail.com")
            expect(users[1].email).toBe("second@gmail.com")
        })

        it("should not return the password field", async () => {
            await userRepository.save({ ...userData })

            const adminAccessToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .get("/users")
                .set("Cookie", [`accessToken=${adminAccessToken}`])
                .send()

            const users = response.body as User[]

            expect(users[0]).not.toHaveProperty("password")
        })

        it("should return an empty list if there are no users", async () => {
            const adminAccessToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .get("/users")
                .set("Cookie", [`accessToken=${adminAccessToken}`])
                .send()

            expect(response.statusCode).toBe(200)
            expect(response.body as User[]).toHaveLength(0)
        })
    })

    describe("given a non admin user", () => {
        it("should return 401 if user is not authenticated", async () => {
            const response = await request(app).get("/users").send()

            expect(response.statusCode).toBe(401)
        })

        it("should return 403 if user is not admin", async () => {
            const managerAccessToken = jwks.token({
                sub: "1",
                role: Roles.MANAGER,
            })

            const response = await request(app)
                .get("/users")
                .set("Cookie", [`accessToken=${managerAccessToken}`])
                .send()

            expect(response.statusCode).toBe(403)
        })
    })
})
