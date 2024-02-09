import express, { Application, Request } from 'express';
import * as jose from 'jose'
import { JSONWebKeySet, KeyLike } from 'jose';
const app: Application = express();

const publics: JSONWebKeySet = { keys: [] };
const privates: KeyLike[] = [];

app.get('/', async (req, res) => {
	console.log(`Request for JWKS\n${publics}\n`)
	res.status(200).send(JSON.stringify(publics))
})

app.post('/auth', async (req : Request<{expired?: string}>, res) => {
	const expiration = 60 * 60 * (req.params.expired ? -1 : 1) + (Date.now() / 1000)
	const kid = Date.now().toString()
	const {publicKey, privateKey} = await jose.generateKeyPair('RS256')
	if(!req.params.expired) {
		const jwk = await jose.exportJWK(publicKey)
		jwk.kid = kid
		publics.keys.push(jwk)
		privates.push(privateKey)
	}

	const jwt = await new jose.SignJWT({})
		.setProtectedHeader({alg: 'RS256', kid: kid})
		.setIssuedAt()
		.setExpirationTime( expiration)
		.sign(privateKey)

	console.log('Issued ' + (req.params.expired ? 'expired' : 'valid') + ' token')
	res.status(200).send(jwt)
});

app.listen(8080, () => {
	console.log('Server is running on port 8080');
});

export default app