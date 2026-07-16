import request from "supertest"
import app from "../../src/app"
import { DataSource, Repository } from "typeorm"
import { AppDataSource } from "../../src/config/data-source"
import { Tenant } from "../../src/entities/Tenant"
import * as jwksModule from "mock-jwks"
import type { JWKSMock } from "mock-jwks"
import { User } from "../../src/entities/User"
import { Roles } from "../../src/constants"

type CreateJWKMock = (host: string, path?: string) => JWKSMock

const jwksExport = jwksModule as unknown as {
    default: CreateJWKMock | { default: CreateJWKMock }
}

const createJWKMock: CreateJWKMock =
    typeof jwksExport.default === "function"
        ? jwksExport.default
        : jwksExport.default.default

describe("POST /tenants", () => {
    let connection: DataSource
    let userRepository: Repository<User>

    const userData = {
        firstName: "harshal",
        lastName: "chauhan",
        email: "harshal@gmail.com",
        password: "1234567890",
    }

    let jwks: ReturnType<typeof createJWKMock>

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

    describe("given all fields", () => {
        it("should return 201 status code", async () => {
            const tenantData = {
                name: "tenant name",
                address: "tenant address",
            }

            const data = await userRepository.save({
                ...userData,
                role: Roles.ADMIN,
            })

            const accessToken = jwks.token({
                sub: String(data.id),
                role: data.role,
            })

            const response = await request(app)
                .post("/tenants")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send(tenantData)

            expect(response.statusCode).toBe(201)
        })

        it("should create a tentant in the database", async () => {
            const tenantData = {
                name: "tenant name",
                address: "tenant address",
            }

            const data = await userRepository.save({
                ...userData,
                role: Roles.ADMIN,
            })

            const accessToken = jwks.token({
                sub: String(data.id),
                role: data.role,
            })

            const response = await request(app)
                .post("/tenants")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send(tenantData)

            const tenantRepository = connection.getRepository(Tenant)
            const tenants = await tenantRepository.find()

            expect(response.statusCode).toBe(201)

            expect(tenants).toHaveLength(1)

            expect(tenants[0].name).toBe(tenantData.name)
            expect(tenants[0].address).toBe(tenantData.address)
        })

        it("should return 401 if user is not authenticated", async () => {
            const tenantData = {
                name: "tenant name",
                address: "tenant address",
            }

            const response = await request(app)
                .post("/tenants")
                .send(tenantData)

            expect(response.statusCode).toBe(401)
        })

        it("should return 403 if user is not admin", async () => {
            const tenantData = {
                name: "tenant name",
                address: "tenant address",
            }

            const data = await userRepository.save({
                ...userData,
                role: Roles.MANAGER,
            })

            const accessToken = jwks.token({
                sub: String(data.id),
                role: data.role,
            })

            const response = await request(app)
                .post("/tenants")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send(tenantData)

            expect(response.statusCode).toBe(403)

            const tenantRepository = connection.getRepository(Tenant)
            const tenants = await tenantRepository.find()

            expect(tenants).toHaveLength(0)
        })
    })
})
