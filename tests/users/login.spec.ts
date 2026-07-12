import request from "supertest"
import app from "../../src/app"
import { DataSource } from "typeorm"
import { AppDataSource } from "../../src/data-source"
import { isJwt } from "../../src/utils/index"

describe("POST /auth/login", () => {
    let connection: DataSource

    const userData = {
        firstName: "harshal",
        lastName: "chauhan",
        email: "harshal@gmail.com",
        password: "1234567890",
    }

    beforeAll(async () => {
        connection = await AppDataSource.initialize()
    })

    beforeEach(async () => {
        await connection.dropDatabase()
        await connection.synchronize()

        await request(app).post("/auth/register").send(userData)
    })

    afterAll(async () => {
        await connection.destroy()
    })

    describe("given all fields", () => {
        it("should return 200 status code", async () => {
            const response = await request(app)
                .post("/auth/login")
                .send({ email: userData.email, password: userData.password })

            expect(response.statusCode).toBe(200)
        })

        it("should return valid JSON response", async () => {
            const response = await request(app)
                .post("/auth/login")
                .send({ email: userData.email, password: userData.password })

            expect(response.headers["content-type"]).toEqual(
                expect.stringContaining("json"),
            )
        })

        it("should return the id of the logged in user", async () => {
            const response = await request(app)
                .post("/auth/login")
                .send({ email: userData.email, password: userData.password })

            expect(response.body).toHaveProperty("id")
        })

        it("should return access token and refresh token inside the cookie", async () => {
            interface Headers {
                ["set-cookie"]: string[]
            }

            const response = await request(app)
                .post("/auth/login")
                .send({ email: userData.email, password: userData.password })

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
            expect(isJwt(refreshToken)).toBe(true)
        })
    })

    describe("given wrong credentials", () => {
        it("should return 400 if the password is wrong", async () => {
            const response = await request(app)
                .post("/auth/login")
                .send({ email: userData.email, password: "wrongpassword" })

            expect(response.statusCode).toBe(400)
        })

        it("should return 400 if the email does not exist", async () => {
            const response = await request(app)
                .post("/auth/login")
                .send({ email: "nope@gmail.com", password: userData.password })

            expect(response.statusCode).toBe(400)
        })

        it("should not leak which field was wrong", async () => {
            const response = await request(app)
                .post("/auth/login")
                .send({ email: userData.email, password: "wrongpassword" })

            // both wrong-email and wrong-password return the same message
            expect(response.body.errors[0].msg).toBe(
                "Email or password does not match!",
            )
        })
    })

    describe("fields are missing", () => {
        it("should return 400 if email is missing", async () => {
            const response = await request(app)
                .post("/auth/login")
                .send({ email: "", password: userData.password })

            expect(response.statusCode).toBe(400)
        })

        it("should return 400 if password is missing", async () => {
            const response = await request(app)
                .post("/auth/login")
                .send({ email: userData.email, password: "" })

            expect(response.statusCode).toBe(400)
        })
    })
})
