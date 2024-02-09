import request from "supertest"
import app from "../index"
import jose from "jose"


describe("auth", () => {
	it("should return 200", async () => {
		const res = await request(app).post("/auth")
		expect(res.statusCode).toEqual(200)
		
		let jwk = await jose.importJWK(res.body)
	}
)})
