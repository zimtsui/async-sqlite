import sqlite from 'sqlite3';
import { once } from 'events';
import Bluebird from 'bluebird';
import Startable from 'startable';
const { promisifyAll } = Bluebird;
sqlite.verbose();
;
class Database extends Startable {
    constructor(filePath) {
        super();
        this.filePath = filePath;
    }
    async _start() {
        this.db = promisifyAll(new sqlite.Database(this.filePath));
        await once(this.db, 'open');
        this.db.configure('busyTimeout', 1000);
        // await this.db.serializeAsync();
    }
    async _stop() {
        await this.db.closeAsync();
    }
    async sql(clause) {
        return await this.db.allAsync(clause);
    }
}
export { Database as default, Database, };
//# sourceMappingURL=promisified-sqlite.js.map