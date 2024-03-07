import express, { Application, Request, Response } from 'express';
import { auth, wellKnown, initDb, initKeys } from './controllers';
const app: Application = express();

const methodNotAllowed = (_req: Request, res : Response) => res.status(405).send();

initDb()
initKeys()

app.use(express.json());
app.use(express.urlencoded());

app.get('/.well-known/jwks.json', wellKnown)
app.all('/.well-known/jwks.json', methodNotAllowed);

app.post('/auth', auth)
app.all('/auth', methodNotAllowed);

app.listen(8080, () => {
	console.log('Server is running on port 8080'); 
});

export default app