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

        it.todo("should return 403 if non admin user try to create a user")
    })
})
