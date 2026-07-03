import request from "supertest"
import app from "../../src/app"

describe("POST /auth/register", () => {
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
    })
})
