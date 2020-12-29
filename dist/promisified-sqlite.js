import sqlite from 'sqlite3';
import { once } from 'events';
import Bluebird from 'bluebird';
import Startable from 'startable';
import fse from 'fs-extra';
import { dirname } from 'path';
import { COMMIT_INTERVAL } from './config';
const { promisifyAll } = Bluebird;
const { ensureDir } = fse;
sqlite.verbose();
class Database extends Startable {
    constructor(filePath) {
        super();
        this.filePath = filePath;
        this.statementCount = 0;
    }
    async _start() {
        // if the containing directory doesn't exist, node-sqlite3 won't throw
        // but will exit for segment fault. here it's doomed to be thread unsafe.
        await ensureDir(dirname(this.filePath));
        this.db = promisifyAll(new sqlite.Database(this.filePath));
        await once(this.db, 'open');
        this.db.configure('busyTimeout', 1000);
        // if parallelized, COMMIT in stop() may not be latest executed.
        this.db.serialize();
        await this.sql(`BEGIN;`);
    }
    async _stop() {
        await this.sql(`COMMIT;`);
        await this.db.closeAsync();
    }
    async sql(clause) {
        const r = await this.db.allAsync(clause);
        if (++this.statementCount === COMMIT_INTERVAL) {
            this.statementCount = 0;
            await this.sql(`COMMIT;BEGIN;`);
        }
        return r;
    }
}
export { Database as default, Database, };
//# sourceMappingURL=promisified-sqlite.js.map