import request from "supertest"
import app from "../../src/app"
import { DataSource } from "typeorm"
import { AppDataSource } from "../../src/config/data-source"
import { User } from "../../src/entities/User"
import { RefreshToken } from "../../src/entities/RefreshToken"
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

interface CookieHeaders {
    ["set-cookie"]: string[]
}

const extractRefreshToken = (headers: unknown): string | null => {
    let refreshToken: string | null = null
    const cookies = (headers as CookieHeaders)["set-cookie"] || []
    cookies.forEach((cookie) => {
        if (cookie.startsWith("refreshToken=")) {
            refreshToken = cookie.split(";")[0].split("=")[1]
        }
    })
    return refreshToken
}

describe("POST /auth/logout", () => {
    let connection: DataSource
    let jwks: ReturnType<typeof createJWKMock>

    const userData = {
        firstName: "harshal",
        lastName: "chauhan",
        email: "harshal@gmail.com",
        password: "1234567890",
    }

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

    const createSession = async () => {
        const registerResponse = await request(app)
            .post("/auth/register")
            .send(userData)

        const refreshToken = extractRefreshToken(registerResponse.headers)

        const userRepository = connection.getRepository(User)
        const user = await userRepository.findOne({
            where: { email: userData.email },
        })

        if (!user) {
            throw new Error("Test setup failed: user was not registered")
        }

        const accessToken = jwks.token({
            sub: String(user.id),
            role: user.role,
        })

        return { accessToken, refreshToken, user }
    }

    describe("given valid access and refresh tokens", () => {
        it("should return 200 status code", async () => {
            const { accessToken, refreshToken } = await createSession()

            const response = await request(app)
                .post("/auth/logout")
                .set("Cookie", [
                    `accessToken=${accessToken}`,
                    `refreshToken=${refreshToken}`,
                ])
                .send()

            expect(response.statusCode).toBe(200)
        })

        it("should delete the refresh token from the database", async () => {
            const { accessToken, refreshToken, user } = await createSession()

            const refreshTokenRepository =
                connection.getRepository(RefreshToken)

            const before = await refreshTokenRepository
                .createQueryBuilder("refreshToken")
                .where("refreshToken.userId = :userId", { userId: user.id })
                .getMany()
            expect(before).toHaveLength(1)

            await request(app)
                .post("/auth/logout")
                .set("Cookie", [
                    `accessToken=${accessToken}`,
                    `refreshToken=${refreshToken}`,
                ])
                .send()

            const after = await refreshTokenRepository
                .createQueryBuilder("refreshToken")
                .where("refreshToken.userId = :userId", { userId: user.id })
                .getMany()
            expect(after).toHaveLength(0)
        })

        it("should clear the access and refresh token cookies", async () => {
            const { accessToken, refreshToken } = await createSession()

            const response = await request(app)
                .post("/auth/logout")
                .set("Cookie", [
                    `accessToken=${accessToken}`,
                    `refreshToken=${refreshToken}`,
                ])
                .send()

            const cookies =
                (response.headers as unknown as CookieHeaders)["set-cookie"] ||
                []

            const accessCleared = cookies.find((c) =>
                c.startsWith("accessToken="),
            )
            const refreshCleared = cookies.find((c) =>
                c.startsWith("refreshToken="),
            )

            // clearing a cookie emits an empty value with a past expiry
            expect(accessCleared).toContain("accessToken=;")
            expect(refreshCleared).toContain("refreshToken=;")
        })
    })

    describe("given missing tokens", () => {
        it("should return 401 if the access token is missing", async () => {
            const { refreshToken } = await createSession()

            const response = await request(app)
                .post("/auth/logout")
                .set("Cookie", [`refreshToken=${refreshToken}`])
                .send()

            expect(response.statusCode).toBe(401)
        })

        it("should return 401 if the refresh token is missing", async () => {
            const { accessToken } = await createSession()

            const response = await request(app)
                .post("/auth/logout")
                .set("Cookie", [`accessToken=${accessToken}`])
                .send()

            expect(response.statusCode).toBe(401)
        })
    })
})
