import request from "supertest"
import app from "../../src/app"
import { DataSource, Repository } from "typeorm"
import { AppDataSource } from "../../src/config/data-source"
import { User } from "../../src/entities/User"
import { Tenant } from "../../src/entities/Tenant"
import { Roles } from "../../src/constants"
import * as jwksModule from "mock-jwks"
import type { JWKSMock } from "mock-jwks"

interface PaginatedUsers {
    currentPage: number
    perPage: number
    total: number
    data: User[]
}

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

        it("should return all the users inside a data array", async () => {
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

            const body = response.body as PaginatedUsers

            expect(body.data).toHaveLength(2)
            expect(body.data[0].email).toBe("second@gmail.com")
            expect(body.data[1].email).toBe("first@gmail.com")
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

            const body = response.body as PaginatedUsers

            expect(body.data[0]).not.toHaveProperty("password")
        })

        it("should include the tenant relation for each user", async () => {
            const tenantRepository = connection.getRepository(Tenant)
            const tenant = await tenantRepository.save({
                name: "tenant name",
                address: "tenant address",
            })
            await userRepository.save({ ...userData, tenant })

            const adminAccessToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .get("/users")
                .set("Cookie", [`accessToken=${adminAccessToken}`])
                .send()

            const body = response.body as PaginatedUsers

            expect(body.data[0]).toHaveProperty("tenant")
            expect(body.data[0].tenant).toBeTruthy()
            expect(body.data[0].tenant?.id).toBe(tenant.id)
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

            const body = response.body as PaginatedUsers

            expect(response.statusCode).toBe(200)
            expect(body.data).toHaveLength(0)
            expect(body.total).toBe(0)
        })

        it("should return pagination metadata in the response", async () => {
            await userRepository.save([
                { ...userData, email: "first@gmail.com" },
                { ...userData, email: "second@gmail.com" },
            ])

            const adminAccessToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .get("/users?currentPage=1&perPage=10")
                .set("Cookie", [`accessToken=${adminAccessToken}`])
                .send()

            const body = response.body as PaginatedUsers

            expect(body.currentPage).toBe(1)
            expect(body.perPage).toBe(10)
            expect(body.total).toBe(2)
            expect(body.data).toHaveLength(2)
        })

        it("should only return perPage users per page", async () => {
            await userRepository.save([
                { ...userData, email: "first@gmail.com" },
                { ...userData, email: "second@gmail.com" },
                { ...userData, email: "third@gmail.com" },
            ])

            const adminAccessToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .get("/users?currentPage=1&perPage=2")
                .set("Cookie", [`accessToken=${adminAccessToken}`])
                .send()

            const body = response.body as PaginatedUsers

            expect(body.total).toBe(3)
            expect(body.data).toHaveLength(2)
            expect(body.data[0].email).toBe("third@gmail.com")
            expect(body.data[1].email).toBe("second@gmail.com")
        })

        it("should return the requested page of users", async () => {
            await userRepository.save([
                { ...userData, email: "first@gmail.com" },
                { ...userData, email: "second@gmail.com" },
                { ...userData, email: "third@gmail.com" },
            ])

            const adminAccessToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .get("/users?currentPage=2&perPage=2")
                .set("Cookie", [`accessToken=${adminAccessToken}`])
                .send()

            const body = response.body as PaginatedUsers

            expect(body.currentPage).toBe(2)
            expect(body.data).toHaveLength(1)
            expect(body.data[0].email).toBe("first@gmail.com")
        })

        it("should default to page 1 with a default page size when no query is provided", async () => {
            await userRepository.save({ ...userData })

            const adminAccessToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .get("/users")
                .set("Cookie", [`accessToken=${adminAccessToken}`])
                .send()

            const body = response.body as PaginatedUsers

            expect(body.currentPage).toBe(1)
            expect(body.perPage).toBe(6)
        })
    })

    describe("given a search or role filter", () => {
        const searchUsers = [
            {
                firstName: "Alice",
                lastName: "Anderson",
                email: "alice@gmail.com",
                password: "1234567890",
                role: Roles.ADMIN,
            },
            {
                firstName: "Bob",
                lastName: "Brown",
                email: "bob@gmail.com",
                password: "1234567890",
                role: Roles.MANAGER,
            },
            {
                firstName: "Carol",
                lastName: "Clark",
                email: "carol@gmail.com",
                password: "1234567890",
                role: Roles.CUSTOMER,
            },
        ]

        it("should return users matching the q search on first name", async () => {
            await userRepository.save(searchUsers.map((user) => ({ ...user })))

            const adminAccessToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .get("/users?q=Alice")
                .set("Cookie", [`accessToken=${adminAccessToken}`])
                .send()

            const body = response.body as PaginatedUsers

            expect(body.total).toBe(1)
            expect(body.data).toHaveLength(1)
            expect(body.data[0].email).toBe("alice@gmail.com")
        })

        it("should match the q search on last name case-insensitively", async () => {
            await userRepository.save(searchUsers.map((user) => ({ ...user })))

            const adminAccessToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .get("/users?q=brown")
                .set("Cookie", [`accessToken=${adminAccessToken}`])
                .send()

            const body = response.body as PaginatedUsers

            expect(body.total).toBe(1)
            expect(body.data[0].email).toBe("bob@gmail.com")
        })

        it("should match the q search on a full name", async () => {
            await userRepository.save(searchUsers.map((user) => ({ ...user })))

            const adminAccessToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .get("/users?q=Carol Clark")
                .set("Cookie", [`accessToken=${adminAccessToken}`])
                .send()

            const body = response.body as PaginatedUsers

            expect(body.total).toBe(1)
            expect(body.data[0].email).toBe("carol@gmail.com")
        })

        it("should match the q search on email", async () => {
            await userRepository.save(searchUsers.map((user) => ({ ...user })))

            const adminAccessToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .get("/users?q=bob@gmail")
                .set("Cookie", [`accessToken=${adminAccessToken}`])
                .send()

            const body = response.body as PaginatedUsers

            expect(body.total).toBe(1)
            expect(body.data[0].email).toBe("bob@gmail.com")
        })

        it("should return only users with the requested role", async () => {
            await userRepository.save(searchUsers.map((user) => ({ ...user })))

            const adminAccessToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .get(`/users?role=${Roles.MANAGER}`)
                .set("Cookie", [`accessToken=${adminAccessToken}`])
                .send()

            const body = response.body as PaginatedUsers

            expect(body.total).toBe(1)
            expect(body.data).toHaveLength(1)
            expect(body.data[0].role).toBe(Roles.MANAGER)
            expect(body.data[0].email).toBe("bob@gmail.com")
        })

        it("should combine the q search and role filter", async () => {
            await userRepository.save([
                ...searchUsers.map((user) => ({ ...user })),
                {
                    firstName: "Alice",
                    lastName: "Adams",
                    email: "alice.manager@gmail.com",
                    password: "1234567890",
                    role: Roles.MANAGER,
                },
            ])

            const adminAccessToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .get(`/users?q=Alice&role=${Roles.MANAGER}`)
                .set("Cookie", [`accessToken=${adminAccessToken}`])
                .send()

            const body = response.body as PaginatedUsers

            expect(body.total).toBe(1)
            expect(body.data).toHaveLength(1)
            expect(body.data[0].email).toBe("alice.manager@gmail.com")
        })

        it("should return all users when q and role are empty", async () => {
            await userRepository.save(searchUsers.map((user) => ({ ...user })))

            const adminAccessToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .get("/users?q=&role=")
                .set("Cookie", [`accessToken=${adminAccessToken}`])
                .send()

            const body = response.body as PaginatedUsers

            expect(body.total).toBe(3)
            expect(body.data).toHaveLength(3)
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
