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
        // 如果打开过程中发生错误，比如目录不存在，new 依然会成功，而是出发 error 事件。
        this.db = promisifyAll(new sqlite.Database(this.filePath));
        await once(this.db, 'open');
    }
    async _stop() {
        for (const statement of this.statements)
            await statement.finalizeAsync();
        // 在一个打开过程中出错的对象上调用 close 会段错误。
        if (this.db && await this.start().then(() => true, () => false))
            await this.db.closeAsync();
    }
    async sql(clause, ...params) {
        assert(this.lifePeriod === "STARTED" /* STARTED */);
        return await this.db.allAsync(clause, ...params);
    }
    async open(clause, ...params) {
        assert(this.lifePeriod === "STARTED" /* STARTED */);
        const statement = await this.db.prepareAsync(clause, ...params);
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