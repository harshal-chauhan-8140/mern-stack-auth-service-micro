import { describe, it, expect } from "@jest/globals"
import { calculateDiscount } from "./src/util.ts"
import request from "supertest"
import app from "./src/app.ts"

describe("App", () => {
    it("should return correct discount amount", () => {
        const discount = calculateDiscount(100, 10)
        expect(discount).toBe(10)
    })

    it("should return 200 status code", async () => {
        const response = await request(app).get("/").send()

        expect(response.status).toBe(200)
    })
})
