import sqlite from 'sqlite3';
import { once } from 'events';
import Bluebird from 'bluebird';
import Startable from 'startable';
import fse from 'fs-extra';
import { dirname } from 'path';
const { promisifyAll } = Bluebird;
const { ensureDir } = fse;
sqlite.verbose();
class Database extends Startable {
    constructor(filePath) {
        super();
        this.filePath = filePath;
    }
    async _start() {
        // if the containing directory doesn't exist, node-sqlite3 won't throw
        // but will exit for segment fault. here it's doomed to be thread unsafe.
        await ensureDir(dirname(this.filePath));
        this.db = promisifyAll(new sqlite.Database(this.filePath));
        await once(this.db, 'open');
        this.db.configure('busyTimeout', 1000);
        // this.db.serialize();
        await this.db.allAsync(`BEGIN IMMEDIATE;`);
    }
    async _stop() {
        await this.db.allAsync(`COMMIT;`);
        await this.db.closeAsync();
    }
    async sql(clause) {
        return await this.db.allAsync(clause);
    }
}
export { Database as default, Database, };
//# sourceMappingURL=promisified-sqlite.js.map