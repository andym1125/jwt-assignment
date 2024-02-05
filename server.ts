import express, { Application } from 'express';
import * as jose from 'jose'
const app: Application = express();

const {publicKey, privateKey} = await jose.generateKeyPair('PS256')
console.log('Public Key: ' + (publicKey))

app.get('/', async (req, res) => {
	res.send(await jose.exportSPKI(publicKey))
})

app.post('/auth', async (req, res) => {
	const jwt = await new jose.SignJWT({})
		.setProtectedHeader({alg: 'PS256'})
		.setIssuedAt()
		.setExpirationTime('2h')
		.sign(privateKey)
	console.log('Issued: ' + jwt)
	res.send(jwt)
});

app.listen(8080, () => {
	console.log('Server is running on port 8080');
});