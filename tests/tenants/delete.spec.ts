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

describe("DELETE /tenants/:id", () => {
    let connection: DataSource
    let userRepository: Repository<User>
    let tenantRepository: Repository<Tenant>

    const userData = {
        firstName: "harshal",
        lastName: "chauhan",
        email: "harshal@gmail.com",
        password: "1234567890",
    }

    const tenantData = {
        name: "tenant name",
        address: "tenant address",
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
            const tenant = await tenantRepository.save(tenantData)

            const data = await userRepository.save({
                ...userData,
                role: Roles.ADMIN,
            })

            const accessToken = jwks.token({
                sub: String(data.id),
                role: data.role,
            })

            const response = await request(app)
                .delete(`/tenants/${tenant.id}`)
                .set("Cookie", [`accessToken=${accessToken}`])
                .send()

            expect(response.statusCode).toBe(200)
        })

        it("should remove the tenant from the database", async () => {
            const tenant = await tenantRepository.save(tenantData)

            const data = await userRepository.save({
                ...userData,
                role: Roles.ADMIN,
            })

            const accessToken = jwks.token({
                sub: String(data.id),
                role: data.role,
            })

            await request(app)
                .delete(`/tenants/${tenant.id}`)
                .set("Cookie", [`accessToken=${accessToken}`])
                .send()

            const tenants = await tenantRepository.find()

            expect(tenants).toHaveLength(0)
        })

        it("should only remove the requested tenant", async () => {
            const tenant = await tenantRepository.save(tenantData)
            await tenantRepository.save({
                name: "other tenant",
                address: "other address",
            })

            const data = await userRepository.save({
                ...userData,
                role: Roles.ADMIN,
            })

            const accessToken = jwks.token({
                sub: String(data.id),
                role: data.role,
            })

            await request(app)
                .delete(`/tenants/${tenant.id}`)
                .set("Cookie", [`accessToken=${accessToken}`])
                .send()

            const tenants = await tenantRepository.find()

            expect(tenants).toHaveLength(1)
            expect(tenants[0].name).toBe("other tenant")
        })

        it("should return the id of the deleted tenant", async () => {
            const tenant = await tenantRepository.save(tenantData)

            const data = await userRepository.save({
                ...userData,
                role: Roles.ADMIN,
            })

            const accessToken = jwks.token({
                sub: String(data.id),
                role: data.role,
            })

            const response = await request(app)
                .delete(`/tenants/${tenant.id}`)
                .set("Cookie", [`accessToken=${accessToken}`])
                .send()

            expect((response.body as Record<string, number>).id).toBe(tenant.id)
        })

        it("should return 400 if the id param is not a number", async () => {
            const data = await userRepository.save({
                ...userData,
                role: Roles.ADMIN,
            })

            const accessToken = jwks.token({
                sub: String(data.id),
                role: data.role,
            })

            const response = await request(app)
                .delete("/tenants/abc")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send()

            expect(response.statusCode).toBe(400)
        })

        it("should return 404 if the tenant does not exist", async () => {
            const data = await userRepository.save({
                ...userData,
                role: Roles.ADMIN,
            })

            const accessToken = jwks.token({
                sub: String(data.id),
                role: data.role,
            })

            const response = await request(app)
                .delete("/tenants/999")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send()

            expect(response.statusCode).toBe(404)
        })
    })

    describe("given a non admin user", () => {
        it("should return 401 if user is not authenticated", async () => {
            const tenant = await tenantRepository.save(tenantData)

            const response = await request(app)
                .delete(`/tenants/${tenant.id}`)
                .send()

            expect(response.statusCode).toBe(401)

            const tenants = await tenantRepository.find()

            expect(tenants).toHaveLength(1)
        })

        it("should return 403 if user is not admin", async () => {
            const tenant = await tenantRepository.save(tenantData)

            const data = await userRepository.save({
                ...userData,
                role: Roles.MANAGER,
            })

            const accessToken = jwks.token({
                sub: String(data.id),
                role: data.role,
            })

            const response = await request(app)
                .delete(`/tenants/${tenant.id}`)
                .set("Cookie", [`accessToken=${accessToken}`])
                .send()

            expect(response.statusCode).toBe(403)

            const tenants = await tenantRepository.find()

            expect(tenants).toHaveLength(1)
        })
    })
})
