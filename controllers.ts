import { JSONWebKeySet} from "jose";
import * as jose from 'jose'
import {Request, Response } from 'express';
import sqlite3 from 'sqlite3'
import { Database, open } from 'sqlite'

let dbConn : Database<sqlite3.Database, sqlite3.Statement>

interface DbKeyEntry {
	kid: number
	key: string
	exp: number
}

const ALGO = 'RS256'

const sqlSchemaCreate = 
'CREATE TABLE IF NOT EXISTS keys(' +
'    kid INTEGER PRIMARY KEY AUTOINCREMENT,' +
'    key BLOB NOT NULL,' +
'    exp INTEGER NOT NULL' +
')' //TODO is this the right way to do this?
const sqlInsertKey = 'INSERT INTO keys (key, exp) VALUES (?, ?)'
const sqlGetKeys = 'SELECT * FROM keys'

export const initDb = async () => {
	dbConn = await open({
		filename: './totally_not_my_privateKeys.db',
		driver: sqlite3.Database
	})
	dbConn.exec(sqlSchemaCreate)
}

//This is to add requested unexpired and expired keys
export const initKeys = async () => {
	//insert initial key
	const key = await jose.generateKeyPair(ALGO)
	await dbConn.run(
		sqlInsertKey,
		await jose.exportPKCS8(key.privateKey),
		60 * 60 + Math.floor(Date.now() / 1000)
	)

	//insert initial expired key
	const key2 = await jose.generateKeyPair(ALGO)
	await dbConn.run(
		sqlInsertKey,
		await jose.exportPKCS8(key2.privateKey),
		60 * -60 + Math.floor(Date.now() / 1000)
	)
}

export const auth = async (req: Request<{ expired?: string }>, res: Response) => {
	const expired = req.query.expired
	console.log(`Request for JWT\nexpired? ${expired}`)
	const expiration = 60 * 60 * (expired ? -1 : 1) + Math.floor(Date.now() / 1000)
	const key = await jose.generateKeyPair(ALGO)

	const kid = (await dbConn.run(
		sqlInsertKey,
		await jose.exportPKCS8(key.privateKey),
		expiration
	)).lastID
	
	const jwt = await new jose.SignJWT({})
		.setProtectedHeader({ alg: ALGO, kid: String(kid)})
		.setIssuedAt()
		.setExpirationTime(expiration)
		.sign(key.privateKey)

	console.log('Issued ' + (expired ? 'expired' : 'valid'))
	res.status(200).send(jwt)
}

export const wellKnown = async (req: Request, res: Response) => {
	const publics: JSONWebKeySet = { keys: [] };
	let result : DbKeyEntry[] = await dbConn.all(sqlGetKeys)

	result = result.filter((entry) => {
		console.log(entry.exp, Date.now() / 1000, entry.exp > Date.now() / 1000)
		return entry.exp > Date.now() / 1000
	})

	for(const entry of result) {
		const key = await jose.exportJWK(await jose.importPKCS8(entry.key, ALGO))
		key.kid = String(entry.kid)
		publics.keys.push(key)
	}

	console.log(`Request for JWKS\n${publics}\n`)
	res.status(200).send(JSON.stringify(publics))
}