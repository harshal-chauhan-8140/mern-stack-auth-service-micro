import request from "supertest"
import app from "../../src/app"
import { DataSource } from "typeorm"
import { AppDataSource } from "../../src/config/data-source"
import { User } from "../../src/entities/User"
import { Roles } from "../../src/constants"
import * as jwksModule from "mock-jwks"
import type { JWKSMock } from "mock-jwks"
import { Tenant } from "../../src/entities/Tenant"

type CreateJWKMock = (host: string, path?: string) => JWKSMock

const jwksExport = jwksModule as unknown as {
    default: CreateJWKMock | { default: CreateJWKMock }
}

const createJWKMock: CreateJWKMock =
    typeof jwksExport.default === "function"
        ? jwksExport.default
        : jwksExport.default.default

describe("POST /users", () => {
    let connection: DataSource
    let jwks: ReturnType<typeof createJWKMock>

    beforeAll(async () => {
        jwks = createJWKMock("http://localhost:5501")
        connection = await AppDataSource.initialize()
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

    describe("given all fields", () => {
        it("should persist the user in the database ", async () => {
            const tenantData = {
                name: "tenant name",
                address: "tenant Address",
            }

            const tenantRepository = connection.getRepository(Tenant)
            const tenant = await tenantRepository.save(tenantData)

            const userData = {
                firstName: "harshal",
                lastName: "chauhan",
                email: "harshal@gmail.com",
                password: "1234567890",
                tenantId: tenant.id,
            }

            const adminAccessToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .post("/users")
                .set("Cookie", [`accessToken=${adminAccessToken}`])
                .send(userData)

            expect(response.statusCode).toBe(201)

            const userRepository = connection.getRepository(User)
            const user = await userRepository.findOne({
                where: {
                    email: userData.email,
                },
            })

            expect(user).not.toBeNull()
        })

        it("should create manager user ", async () => {
            const tenantData = {
                name: "tenant name",
                address: "tenant Address",
            }

            const tenantRepository = connection.getRepository(Tenant)
            const tenant = await tenantRepository.save(tenantData)

            const userData = {
                firstName: "harshal",
                lastName: "chauhan",
                email: "harshal@gmail.com",
                password: "1234567890",
                tenantId: tenant.id,
                role: Roles.MANAGER,
            }

            const adminAccessToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .post("/users")
                .set("Cookie", [`accessToken=${adminAccessToken}`])
                .send(userData)

            expect(response.statusCode).toBe(201)

            const userRepository = connection.getRepository(User)
            const user = await userRepository.findOne({
                where: {
                    email: userData.email,
                },
            })

            expect(user).not.toBeNull()
            expect(user?.role).toBe(Roles.MANAGER)
        })

        it("should return 403 if non admin user try to create a user", async () => {
            const userData = {
                firstName: "harshal",
                lastName: "chauhan",
                email: "harshal@gmail.com",
                password: "1234567890",
            }

            const managerAccessToken = jwks.token({
                sub: "1",
                role: Roles.MANAGER,
            })

            const response = await request(app)
                .post("/users")
                .set("Cookie", [`accessToken=${managerAccessToken}`])
                .send(userData)

            expect(response.statusCode).toBe(403)

            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()

            expect(users).toHaveLength(0)
        })

        it("should return 401 if user is not authenticated", async () => {
            const userData = {
                firstName: "harshal",
                lastName: "chauhan",
                email: "harshal@gmail.com",
                password: "1234567890",
            }

            const response = await request(app).post("/users").send(userData)

            expect(response.statusCode).toBe(401)

            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()

            expect(users).toHaveLength(0)
        })
    })

    describe("fields are missing", () => {
        const adminToken = () =>
            jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

        it("should return 400 if email field is missing", async () => {
            const response = await request(app)
                .post("/users")
                .set("Cookie", [`accessToken=${adminToken()}`])
                .send({
                    firstName: "harshal",
                    lastName: "chauhan",
                    email: "",
                    password: "1234567890",
                })

            expect(response.statusCode).toBe(400)

            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()

            expect(users).toHaveLength(0)
        })

        it("should return 400 if email is not a valid email", async () => {
            const response = await request(app)
                .post("/users")
                .set("Cookie", [`accessToken=${adminToken()}`])
                .send({
                    firstName: "harshal",
                    lastName: "chauhan",
                    email: "not_an_email",
                    password: "1234567890",
                })

            expect(response.statusCode).toBe(400)
        })

        it("should return 400 if firstName field is missing", async () => {
            const response = await request(app)
                .post("/users")
                .set("Cookie", [`accessToken=${adminToken()}`])
                .send({
                    firstName: "",
                    lastName: "chauhan",
                    email: "harshal@gmail.com",
                    password: "1234567890",
                })

            expect(response.statusCode).toBe(400)
        })

        it("should return 400 if password is shorter than 8 chars", async () => {
            const response = await request(app)
                .post("/users")
                .set("Cookie", [`accessToken=${adminToken()}`])
                .send({
                    firstName: "harshal",
                    lastName: "chauhan",
                    email: "harshal@gmail.com",
                    password: "1234",
                })

            expect(response.statusCode).toBe(400)
        })

        it("should return 400 if role is not a valid role", async () => {
            const response = await request(app)
                .post("/users")
                .set("Cookie", [`accessToken=${adminToken()}`])
                .send({
                    firstName: "harshal",
                    lastName: "chauhan",
                    email: "harshal@gmail.com",
                    password: "1234567890",
                    role: "superhero",
                })

            expect(response.statusCode).toBe(400)
        })
    })
})
