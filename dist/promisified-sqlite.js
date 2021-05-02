import sqlite from 'sqlite3';
import { once } from 'events';
import Bluebird from 'bluebird';
import { Startable } from 'startable';
import assert from 'assert';
const { promisifyAll } = Bluebird;
sqlite.verbose();
class Database extends Startable {
    constructor(filePath) {
        super();
        this.filePath = filePath;
        // WeakMap 属于元编程，最好不用
        this.iterators = new Map();
        this.statements = new Set();
    }
    async _start() {
        this.db = promisifyAll(new sqlite.Database(this.filePath));
        await once(this.db, 'open');
    }
    async _stop() {
        for (const statement of this.statements)
            await statement.finalizeAsync();
        if (this.db)
            await this.db.closeAsync();
    }
    async sql(clause) {
        assert(this.lifePeriod === "STARTED" /* STARTED */);
        return await this.db.allAsync(clause);
    }
    async open(clause) {
        assert(this.lifePeriod === "STARTED" /* STARTED */);
        const statement = await this.db.prepareAsync(clause);
        const iterator = this.step(statement);
        this.iterators.set(iterator, statement);
        this.statements.add(statement);
        return iterator;
    }
    async *step(statement) {
        for (let row;;) {
            assert(this.statements.has(statement));
            row = await statement.getAsync() || null;
            if (!row)
                break;
            yield row;
        }
    }
    async close(iterator) {
        assert(this.lifePeriod === "STARTED" /* STARTED */);
        const statement = this.iterators.get(iterator);
        assert(statement);
        this.iterators.delete(iterator);
        this.statements.delete(statement);
        await statement.finalizeAsync();
    }
}
export { Database as default, Database, };
//# sourceMappingURL=promisified-sqlite.js.map