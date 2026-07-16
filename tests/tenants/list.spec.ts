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

describe("GET /tenants", () => {
    let connection: DataSource
    let userRepository: Repository<User>
    let tenantRepository: Repository<Tenant>

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
        tenantRepository = connection.getRepository(Tenant)
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
            const data = await userRepository.save({
                ...userData,
                role: Roles.ADMIN,
            })

            const accessToken = jwks.token({
                sub: String(data.id),
                role: data.role,
            })

            const response = await request(app)
                .get("/tenants")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send()

            expect(response.statusCode).toBe(200)
        })

        it("should return all the tenants", async () => {
            await tenantRepository.save([
                { name: "first tenant", address: "first address" },
                { name: "second tenant", address: "second address" },
            ])

            const data = await userRepository.save({
                ...userData,
                role: Roles.ADMIN,
            })

            const accessToken = jwks.token({
                sub: String(data.id),
                role: data.role,
            })

            const response = await request(app)
                .get("/tenants")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send()

            const tenants = response.body as Tenant[]

            expect(tenants).toHaveLength(2)
            expect(tenants[0].name).toBe("first tenant")
            expect(tenants[1].name).toBe("second tenant")
        })

        it("should return an empty list if there are no tenants", async () => {
            const data = await userRepository.save({
                ...userData,
                role: Roles.ADMIN,
            })

            const accessToken = jwks.token({
                sub: String(data.id),
                role: data.role,
            })

            const response = await request(app)
                .get("/tenants")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send()

            expect(response.statusCode).toBe(200)
            expect(response.body as Tenant[]).toHaveLength(0)
        })
    })

    describe("given a non admin user", () => {
        it("should return 401 if user is not authenticated", async () => {
            const response = await request(app).get("/tenants").send()

            expect(response.statusCode).toBe(401)
        })

        it("should return 403 if user is not admin", async () => {
            const data = await userRepository.save({
                ...userData,
                role: Roles.MANAGER,
            })

            const accessToken = jwks.token({
                sub: String(data.id),
                role: data.role,
            })

            const response = await request(app)
                .get("/tenants")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send()

            expect(response.statusCode).toBe(403)
        })
    })
})
