import request from "supertest"
import app from "../index"
import * as jose from "jose" // Import the importJWK function from the jose package


describe("auth", () => {
	it("should return valid", async () => {
		const res = await request(app).post("/auth")
		expect(res.statusCode).toEqual(200)
		
		const jwk = jose.decodeJwt(res.text)
		expect(jwk.exp).toBeGreaterThan(Date.now() / 1000)
	})

	it("should return expired", async () => {
		const res = await request(app).post("/auth?expired=whatev")
		expect(res.statusCode).toEqual(200)
		
		const jwk = jose.decodeJwt(res.text)
		expect(jwk.exp).toBeLessThan(Date.now() / 1000)
	})

	it("should return 1 key", async() => {
		const res = await request(app).get("/.well-known/jwks.json")
		expect(res.statusCode).toEqual(200)
		
		const jwk = JSON.parse(res.text)
		expect(jwk.keys.length).toEqual(1)
	})
})
