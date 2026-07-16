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

describe("PATCH /tenants/:id", () => {
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

    const updatedData = {
        name: "updated name",
        address: "updated address",
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

    describe("given all fields", () => {
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
                .patch(`/tenants/${tenant.id}`)
                .set("Cookie", [`accessToken=${accessToken}`])
                .send(updatedData)

            expect(response.statusCode).toBe(200)
        })

        it("should update the tenant in the database", async () => {
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
                .patch(`/tenants/${tenant.id}`)
                .set("Cookie", [`accessToken=${accessToken}`])
                .send(updatedData)

            const updated = await tenantRepository.findOne({
                where: { id: tenant.id },
            })

            expect(updated?.name).toBe(updatedData.name)
            expect(updated?.address).toBe(updatedData.address)
        })

        it("should not create a new tenant while updating", async () => {
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
                .patch(`/tenants/${tenant.id}`)
                .set("Cookie", [`accessToken=${accessToken}`])
                .send(updatedData)

            const tenants = await tenantRepository.find()

            expect(tenants).toHaveLength(1)
        })

        it("should return the id of the updated tenant", async () => {
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
                .patch(`/tenants/${tenant.id}`)
                .set("Cookie", [`accessToken=${accessToken}`])
                .send(updatedData)

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
                .patch("/tenants/abc")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send(updatedData)

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
                .patch("/tenants/999")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send(updatedData)

            expect(response.statusCode).toBe(404)
        })
    })

    describe("fields are missing", () => {
        it("should return 400 if name field is missing", async () => {
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
                .patch(`/tenants/${tenant.id}`)
                .set("Cookie", [`accessToken=${accessToken}`])
                .send({ name: "", address: updatedData.address })

            expect(response.statusCode).toBe(400)

            const notUpdated = await tenantRepository.findOne({
                where: { id: tenant.id },
            })

            expect(notUpdated?.name).toBe(tenantData.name)
        })

        it("should return 400 if address field is missing", async () => {
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
                .patch(`/tenants/${tenant.id}`)
                .set("Cookie", [`accessToken=${accessToken}`])
                .send({ name: updatedData.name, address: "" })

            expect(response.statusCode).toBe(400)
        })
    })

    describe("given a non admin user", () => {
        it("should return 401 if user is not authenticated", async () => {
            const tenant = await tenantRepository.save(tenantData)

            const response = await request(app)
                .patch(`/tenants/${tenant.id}`)
                .send(updatedData)

            expect(response.statusCode).toBe(401)

            const notUpdated = await tenantRepository.findOne({
                where: { id: tenant.id },
            })

            expect(notUpdated?.name).toBe(tenantData.name)
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
                .patch(`/tenants/${tenant.id}`)
                .set("Cookie", [`accessToken=${accessToken}`])
                .send(updatedData)

            expect(response.statusCode).toBe(403)

            const notUpdated = await tenantRepository.findOne({
                where: { id: tenant.id },
            })

            expect(notUpdated?.name).toBe(tenantData.name)
        })
    })
})
