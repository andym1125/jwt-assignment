import express, { Application, Request, Response } from 'express';
import * as jose from 'jose'
import { JSONWebKeySet, KeyLike } from 'jose';
const app: Application = express();

const publics: JSONWebKeySet = { keys: [] };
const privates: KeyLike[] = [];

const methodNotAllowed = (_req: Request, res : Response) => res.status(405).send();

app.use(express.json());
app.use(express.urlencoded());

app.get('/.well-known/jwks.json', async (req, res) => {
	console.log(`Request for JWKS\n${publics}\n`)
	res.status(200).send(JSON.stringify(publics))
}).all('/.well-known/jwks.json', methodNotAllowed);

app.post('/auth', async (req : Request<{expired?: string}>, res) => {
	const expired = req.query.expired
	console.log(`Request for JWT\n${expired}\n`)
	const expiration = 60 * 60 * (expired ? -1 : 1) + (Date.now() / 1000)
	const kid = Date.now().toString()
	const {publicKey, privateKey} = await jose.generateKeyPair('RS256')
	if(!expired) {
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

	console.log('Issued ' + (expired ? 'expired' : 'valid'))
	res.status(200).send(jwt)
}).all('/auth', methodNotAllowed);

app.listen(8080, () => {
	console.log('Server is running on port 8080'); 
});

export default app