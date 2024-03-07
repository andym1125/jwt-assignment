"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wellKnown = exports.auth = exports.initKeys = exports.initDb = void 0;
const jose = __importStar(require("jose"));
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
const privates = [];
let dbConn;
const ALGO = 'RS256';
const sqlSchemaCreate = 'CREATE TABLE IF NOT EXISTS keys(' +
    '    kid INTEGER PRIMARY KEY AUTOINCREMENT,' +
    '    key BLOB NOT NULL,' +
    '    exp INTEGER NOT NULL' +
    ')'; //TODO is this the right way to do this?
const sqlInsertKey = 'INSERT INTO keys (key, exp) VALUES (?, ?)';
const sqlGetKeys = 'SELECT * FROM keys';
const initDb = () => __awaiter(void 0, void 0, void 0, function* () {
    dbConn = yield (0, sqlite_1.open)({
        filename: './totally_not_my_privateKeys.db',
        driver: sqlite3_1.default.Database
    });
    dbConn.exec(sqlSchemaCreate);
});
exports.initDb = initDb;
//This is to add requested unexpired and expired keys
const initKeys = () => __awaiter(void 0, void 0, void 0, function* () {
    //insert initial key
    const key = yield jose.generateKeyPair(ALGO);
    const kid = (yield dbConn.run(sqlInsertKey, yield jose.exportPKCS8(key.privateKey), 60 * 60 + Math.floor(Date.now() / 1000))).lastID;
    //insert initial expired key
    const key2 = yield jose.generateKeyPair(ALGO);
    const kid2 = (yield dbConn.run(sqlInsertKey, yield jose.exportPKCS8(key.privateKey), 60 * -60 + Math.floor(Date.now() / 1000))).lastID;
});
exports.initKeys = initKeys;
const auth = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const expired = req.query.expired;
    console.log(`Request for JWT\nexpired? ${expired}`);
    const expiration = 60 * 60 * (expired ? -1 : 1) + Math.floor(Date.now() / 1000);
    const key = yield jose.generateKeyPair(ALGO);
    const kid = (yield dbConn.run(sqlInsertKey, yield jose.exportPKCS8(key.privateKey), expiration)).lastID;
    const jwt = yield new jose.SignJWT({})
        .setProtectedHeader({ alg: ALGO, kid: String(kid) })
        .setIssuedAt()
        .setExpirationTime(expiration)
        .sign(key.privateKey);
    console.log('Issued ' + (expired ? 'expired' : 'valid'));
    res.status(200).send(jwt);
});
exports.auth = auth;
const wellKnown = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const publics = { keys: [] };
    let result = yield dbConn.all(sqlGetKeys);
    result = result.filter((entry) => {
        console.log(entry.exp, Date.now() / 1000, entry.exp > Date.now() / 1000);
        return entry.exp > Date.now() / 1000;
    });
    for (const entry of result) {
        let key = yield jose.exportJWK(yield jose.importPKCS8(entry.key, ALGO));
        key.kid = String(entry.kid);
        publics.keys.push(key);
    }
    console.log(`Request for JWKS\n${publics}\n`);
    res.status(200).send(JSON.stringify(publics));
});
exports.wellKnown = wellKnown;
