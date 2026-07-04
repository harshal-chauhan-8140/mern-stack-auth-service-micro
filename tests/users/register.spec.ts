import request from "supertest"
import app from "../../src/app"
import { DataSource } from "typeorm"
import { AppDataSource } from "../../src/data-source"
import { User } from "../../src/entities/User"
import { Roles } from "../../src/constants"

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
    })
})
