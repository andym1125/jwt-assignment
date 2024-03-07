"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const controllers_1 = require("./controllers");
const app = (0, express_1.default)();
const methodNotAllowed = (_req, res) => res.status(405).send();
(0, controllers_1.initDb)();
(0, controllers_1.initKeys)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded());
app.get('/.well-known/jwks.json', controllers_1.wellKnown);
app.all('/.well-known/jwks.json', methodNotAllowed);
app.post('/auth', controllers_1.auth);
app.all('/auth', methodNotAllowed);
app.listen(8080, () => {
    console.log('Server is running on port 8080');
});
exports.default = app;
