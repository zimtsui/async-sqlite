import sqlite from 'sqlite3';
import { once } from 'events';
import Bluebird from 'bluebird';
import { Startable } from 'startable';
import fse from 'fs-extra';
import { dirname } from 'path';
import assert from 'assert';
const { promisifyAll } = Bluebird;
const { ensureDir } = fse;
sqlite.verbose();
class Database extends Startable {
    constructor(filePath) {
        super();
        this.filePath = filePath;
    }
    async _start() {
        /*
        if the containing directory doesn't exist, node-sqlite3 won't throw
        but will exit the whole process for segment fault.
        so you can't open the file directly and catch a exception.
        if predicating the existence, it's thread unsafe.
        */
        await ensureDir(dirname(this.filePath));
        this.db = promisifyAll(new sqlite.Database(this.filePath));
        await once(this.db, 'open');
    }
    async _stop() {
        if (this.db)
            await this.db.closeAsync();
    }
    async sql(clause) {
        assert(this.lifePeriod === "STARTED" /* STARTED */);
        return await this.db.allAsync(clause);
    }
    async *step(clause) {
        assert(this.lifePeriod === "STARTED" /* STARTED */);
        const statement = await this.db.prepareAsync(clause);
        for (let row; row = await statement.getAsync();)
            yield row;
    }
}
export { Database as default, Database, };
//# sourceMappingURL=promisified-sqlite.js.map