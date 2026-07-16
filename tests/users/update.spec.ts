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

describe("PATCH /users/:id", () => {
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

    const updatedData = {
        firstName: "updated",
        lastName: "name",
        role: Roles.MANAGER,
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

    describe("given all fields", () => {
        it("should return 200 status code", async () => {
            const user = await userRepository.save({ ...userData })

            const adminAccessToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .patch(`/users/${user.id}`)
                .set("Cookie", [`accessToken=${adminAccessToken}`])
                .send(updatedData)

            expect(response.statusCode).toBe(200)
        })

        it("should update the user in the database", async () => {
            const user = await userRepository.save({ ...userData })

            const adminAccessToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            await request(app)
                .patch(`/users/${user.id}`)
                .set("Cookie", [`accessToken=${adminAccessToken}`])
                .send(updatedData)

            const updated = await userRepository.findOne({
                where: { id: user.id },
            })

            expect(updated?.firstName).toBe(updatedData.firstName)
            expect(updated?.lastName).toBe(updatedData.lastName)
            expect(updated?.role).toBe(updatedData.role)
        })

        it("should not create a new user while updating", async () => {
            const user = await userRepository.save({ ...userData })

            const adminAccessToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            await request(app)
                .patch(`/users/${user.id}`)
                .set("Cookie", [`accessToken=${adminAccessToken}`])
                .send(updatedData)

            const users = await userRepository.find()

            expect(users).toHaveLength(1)
        })

        it("should not change the email of the user", async () => {
            const user = await userRepository.save({ ...userData })

            const adminAccessToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            await request(app)
                .patch(`/users/${user.id}`)
                .set("Cookie", [`accessToken=${adminAccessToken}`])
                .send({ ...updatedData, email: "hacked@gmail.com" })

            const updated = await userRepository.findOne({
                where: { id: user.id },
            })

            expect(updated?.email).toBe(userData.email)
        })

        it("should return the id of the updated user", async () => {
            const user = await userRepository.save({ ...userData })

            const adminAccessToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .patch(`/users/${user.id}`)
                .set("Cookie", [`accessToken=${adminAccessToken}`])
                .send(updatedData)

            expect((response.body as Record<string, number>).id).toBe(user.id)
        })

        it("should return 400 if the id param is not a number", async () => {
            const adminAccessToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .patch("/users/abc")
                .set("Cookie", [`accessToken=${adminAccessToken}`])
                .send(updatedData)

            expect(response.statusCode).toBe(400)
        })

        it("should return 404 if the user does not exist", async () => {
            const adminAccessToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .patch("/users/999")
                .set("Cookie", [`accessToken=${adminAccessToken}`])
                .send(updatedData)

            expect(response.statusCode).toBe(404)
        })
    })

    describe("fields are missing", () => {
        it("should return 400 if firstName field is missing", async () => {
            const user = await userRepository.save({ ...userData })

            const adminAccessToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .patch(`/users/${user.id}`)
                .set("Cookie", [`accessToken=${adminAccessToken}`])
                .send({ ...updatedData, firstName: "" })

            expect(response.statusCode).toBe(400)

            const notUpdated = await userRepository.findOne({
                where: { id: user.id },
            })

            expect(notUpdated?.firstName).toBe(userData.firstName)
        })

        it("should return 400 if lastName field is missing", async () => {
            const user = await userRepository.save({ ...userData })

            const adminAccessToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .patch(`/users/${user.id}`)
                .set("Cookie", [`accessToken=${adminAccessToken}`])
                .send({ ...updatedData, lastName: "" })

            expect(response.statusCode).toBe(400)
        })

        it("should return 400 if role is not a valid role", async () => {
            const user = await userRepository.save({ ...userData })

            const adminAccessToken = jwks.token({
                sub: "1",
                role: Roles.ADMIN,
            })

            const response = await request(app)
                .patch(`/users/${user.id}`)
                .set("Cookie", [`accessToken=${adminAccessToken}`])
                .send({ ...updatedData, role: "superhero" })

            expect(response.statusCode).toBe(400)
        })
    })

    describe("given a non admin user", () => {
        it("should return 401 if user is not authenticated", async () => {
            const user = await userRepository.save({ ...userData })

            const response = await request(app)
                .patch(`/users/${user.id}`)
                .send(updatedData)

            expect(response.statusCode).toBe(401)

            const notUpdated = await userRepository.findOne({
                where: { id: user.id },
            })

            expect(notUpdated?.firstName).toBe(userData.firstName)
        })

        it("should return 403 if user is not admin", async () => {
            const user = await userRepository.save({ ...userData })

            const managerAccessToken = jwks.token({
                sub: "1",
                role: Roles.MANAGER,
            })

            const response = await request(app)
                .patch(`/users/${user.id}`)
                .set("Cookie", [`accessToken=${managerAccessToken}`])
                .send(updatedData)

            expect(response.statusCode).toBe(403)

            const notUpdated = await userRepository.findOne({
                where: { id: user.id },
            })

            expect(notUpdated?.firstName).toBe(userData.firstName)
        })
    })
})
