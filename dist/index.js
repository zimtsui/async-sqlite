"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite3_1 = __importDefault(require("sqlite3"));
const bluebird_1 = require("bluebird");
const events_1 = require("events");
const util_1 = require("util");
sqlite3_1.default.verbose();
class Database {
    constructor(filepath) {
        this.filepath = filepath;
    }
    async start() {
        this.db = new sqlite3_1.default.Database(this.filepath);
        bluebird_1.promisifyAll(this.db);
        await events_1.once(this.db, 'open');
        this.db.configure('busyTimeout', 1000);
        // await this.db.serializeAsync();
    }
    async stop() {
        if (this.db)
            await this.db.closeAsync();
    }
    async sql(template, ...params) {
        const statement = util_1.format(template, ...params);
        return await this.db.allAsync(statement);
    }
}
exports.Database = Database;
exports.default = Database;
//# sourceMappingURL=index.js.map