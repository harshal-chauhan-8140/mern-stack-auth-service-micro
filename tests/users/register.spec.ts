import request from "supertest"
import app from "../../src/app"
import { DataSource } from "typeorm"
import { AppDataSource } from "../../src/data-source"
import { User } from "../../src/entities/User"
import { Roles } from "../../src/constants"
import { isJwt } from "../../src/utils/index"
import { RefreshToken } from "../../src/entities/RefreshToken"

describe("POST /auth/register", () => {
    let connection: DataSource

    beforeAll(async () => {
        connection = await AppDataSource.initialize()
    })

    beforeEach(async () => {
        await connection.dropDatabase()
        await connection.synchronize()
    })

    afterAll(async () => {
        await connection.destroy()
    })

    describe("Given all fields", () => {
        it("should return 201 status code", async () => {
            const userData = {
                firstName: "harshal",
                lastName: "chauhan",
                email: "harshal@gmail.com",
                password: "1234567890",
            }

            const response = await request(app)
                .post("/auth/register")
                .send(userData)

            expect(response.statusCode).toBe(201)
        })

        it("should return valid JSON response", async () => {
            const userData = {
                firstName: "harshal",
                lastName: "chauhan",
                email: "harshal@gmail.com",
                password: "1234567890",
            }

            const response = await request(app)
                .post("/auth/register")
                .send(userData)

            expect(response.headers["content-type"]).toEqual(
                expect.stringContaining("json"),
            )
        })

        it("should register user in the database", async () => {
            const userData = {
                firstName: "harshal",
                lastName: "chauhan",
                email: "harshal@gmail.com",
                password: "1234567890",
            }

            await request(app).post("/auth/register").send(userData)

            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()

            expect(users).toHaveLength(1)
            expect(users[0].firstName).toBe(userData.firstName)
            expect(users[0].lastName).toBe(userData.lastName)
            expect(users[0].email).toBe(userData.email)
        })

        it("should assign a customer role", async () => {
            const userData = {
                firstName: "harshal",
                lastName: "chauhan",
                email: "harshal@gmail.com",
                password: "1234567890",
            }

            await request(app).post("/auth/register").send(userData)

            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()

            expect(users[0]).toHaveProperty("role")
            expect(users[0].role).toBe(Roles.CUSTOMER)
        })

        it("should store the hashed password in the database", async () => {
            const userData = {
                firstName: "harshal",
                lastName: "chauhan",
                email: "harshal@gmail.com",
                password: "1234567890",
            }

            await request(app).post("/auth/register").send(userData)

            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()

            expect(users[0].password).not.toBe(userData.password)
            expect(users[0].password).toHaveLength(60)
        })

        it("should return access token and refresh token inside the cookie", async () => {
            const userData = {
                firstName: "harshal",
                lastName: "chauhan",
                email: "harshal@gmail.com",
                password: "1234567890",
            }

            interface Headers {
                ["set-cookie"]: string[]
            }

            const response = await request(app)
                .post("/auth/register")
                .send(userData)

            let accessToken = null
            let refreshToken = null

            const cookies =
                (response.headers as unknown as Headers)["set-cookie"] || []

            cookies.forEach((cookie) => {
                if (cookie.startsWith("accessToken=")) {
                    accessToken = cookie.split(";")[0].split("=")[1]
                }
                if (cookie.startsWith("refreshToken=")) {
                    refreshToken = cookie.split(";")[0].split("=")[1]
                }
            })

            expect(accessToken).not.toBeNull()
            expect(refreshToken).not.toBeNull()

            expect(isJwt(accessToken)).toBe(true)
        })

        it("should store the refresh token in the database", async () => {
            const userData = {
                firstName: "harshal",
                lastName: "chauhan",
                email: "harshal@gmail.com",
                password: "1234567890",
            }

            await request(app).post("/auth/register").send(userData)

            const userRepository = connection.getRepository(User)
            const users = await userRepository.find()

            const refreshTokenRepository =
                connection.getRepository(RefreshToken)
            const tokens = await refreshTokenRepository
                .createQueryBuilder("refreshToken")
                .where("refreshToken.userId = :userId", {
                    userId: users[0].id,
                })
                .getMany()

            expect(tokens).toHaveLength(1)
        })
    })
})
