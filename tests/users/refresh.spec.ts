import request from "supertest"
import app from "../../src/app"
import { DataSource } from "typeorm"
import { AppDataSource } from "../../src/config/data-source"
import { User } from "../../src/entities/User"
import { RefreshToken } from "../../src/entities/RefreshToken"
import { isJwt } from "../../src/utils/index"

interface CookieHeaders {
    ["set-cookie"]: string[]
}

const extractTokens = (headers: unknown) => {
    let accessToken: string | null = null
    let refreshToken: string | null = null

    const cookies = (headers as CookieHeaders)["set-cookie"] || []

    cookies.forEach((cookie) => {
        if (cookie.startsWith("accessToken=")) {
            accessToken = cookie.split(";")[0].split("=")[1]
        }
        if (cookie.startsWith("refreshToken=")) {
            refreshToken = cookie.split(";")[0].split("=")[1]
        }
    })

    return { accessToken, refreshToken }
}

describe("POST /auth/refresh", () => {
    let connection: DataSource

    const userData = {
        firstName: "harshal",
        lastName: "chauhan",
        email: "harshal@gmail.com",
        password: "1234567890",
    }

    let refreshToken: string | null

    beforeAll(async () => {
        connection = await AppDataSource.initialize()
    })

    beforeEach(async () => {
        await connection.dropDatabase()
        await connection.synchronize()

        const registerResponse = await request(app)
            .post("/auth/register")
            .send(userData)

        refreshToken = extractTokens(registerResponse.headers).refreshToken
    })

    afterAll(async () => {
        await connection.destroy()
    })

    describe("given a valid refresh token", () => {
        it("should return 200 status code", async () => {
            const response = await request(app)
                .post("/auth/refresh")
                .set("Cookie", [`refreshToken=${refreshToken}`])
                .send()

            expect(response.statusCode).toBe(200)
        })

        it("should return valid JSON response", async () => {
            const response = await request(app)
                .post("/auth/refresh")
                .set("Cookie", [`refreshToken=${refreshToken}`])
                .send()

            expect(response.headers["content-type"]).toEqual(
                expect.stringContaining("json"),
            )
        })

        it("should return the id of the user", async () => {
            const response = await request(app)
                .post("/auth/refresh")
                .set("Cookie", [`refreshToken=${refreshToken}`])
                .send()

            expect(response.body).toHaveProperty("id")
        })

        it("should set a new access token and refresh token inside the cookie", async () => {
            const response = await request(app)
                .post("/auth/refresh")
                .set("Cookie", [`refreshToken=${refreshToken}`])
                .send()

            const { accessToken, refreshToken: newRefreshToken } =
                extractTokens(response.headers)

            expect(accessToken).not.toBeNull()
            expect(newRefreshToken).not.toBeNull()

            expect(isJwt(accessToken)).toBe(true)
            expect(isJwt(newRefreshToken)).toBe(true)
        })

        it("should issue a refresh token different from the one used (rotation)", async () => {
            const response = await request(app)
                .post("/auth/refresh")
                .set("Cookie", [`refreshToken=${refreshToken}`])
                .send()

            const { refreshToken: newRefreshToken } = extractTokens(
                response.headers,
            )

            expect(newRefreshToken).not.toBe(refreshToken)
        })

        it("should rotate the refresh token in the database (old deleted, new persisted)", async () => {
            const userRepository = connection.getRepository(User)
            const refreshTokenRepository =
                connection.getRepository(RefreshToken)

            const users = await userRepository.find()

            const tokensBefore = await refreshTokenRepository
                .createQueryBuilder("refreshToken")
                .where("refreshToken.userId = :userId", {
                    userId: users[0].id,
                })
                .getMany()

            expect(tokensBefore).toHaveLength(1)
            const oldTokenId = tokensBefore[0].id

            await request(app)
                .post("/auth/refresh")
                .set("Cookie", [`refreshToken=${refreshToken}`])
                .send()

            const tokensAfter = await refreshTokenRepository
                .createQueryBuilder("refreshToken")
                .where("refreshToken.userId = :userId", {
                    userId: users[0].id,
                })
                .getMany()

            expect(tokensAfter).toHaveLength(1)
            expect(tokensAfter[0].id).not.toBe(oldTokenId)
        })
    })

    describe("given a missing or invalid refresh token", () => {
        it("should return 401 if no refresh token cookie is provided", async () => {
            const response = await request(app).post("/auth/refresh").send()

            expect(response.statusCode).toBe(401)
        })

        it("should return 401 if the refresh token is malformed", async () => {
            const response = await request(app)
                .post("/auth/refresh")
                .set("Cookie", [`refreshToken=not.a.valid.token`])
                .send()

            expect(response.statusCode).toBe(401)
        })

        it("should return 401 when an already rotated refresh token is reused", async () => {
            await request(app)
                .post("/auth/refresh")
                .set("Cookie", [`refreshToken=${refreshToken}`])
                .send()

            const response = await request(app)
                .post("/auth/refresh")
                .set("Cookie", [`refreshToken=${refreshToken}`])
                .send()

            expect(response.statusCode).toBe(401)
        })
    })
})
