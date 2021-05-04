import sqlite, { Statement } from 'sqlite3';
import { once } from 'events';
import Bluebird from 'bluebird';
import { Startable, LifePeriod } from 'startable';
import assert from 'assert';
import { StatementIterator } from './interfaces';
const { promisifyAll } = Bluebird;
sqlite.verbose();


class Database extends Startable {
    private db?: sqlite.Database;
    // WeakMap 属于元编程，最好不用
    private iterators = new Map<StatementIterator<object>, Statement<object>>();
    private statements = new Set<Statement<object>>();

    constructor(private filePath: string) {
        super();
    }

    protected async _start(): Promise<void> {
        // 如果打开过程中发生错误，比如目录不存在，new 依然会成功，而是出发 error 事件。
        this.db = promisifyAll(new sqlite.Database(this.filePath));
        await once(this.db, 'open');
    }

    protected async _stop(): Promise<void> {
        for (const statement of this.statements)
            await statement.finalizeAsync();
        // 在一个打开过程中出错的对象上调用 close 会段错误。
        if (this.db && await this.start().then(() => true, () => false))
            await this.db.closeAsync();
    }

    public async sql<T extends object | null = null>(
        clause: string, ...params: any[]
    ): Promise<T[]> {
        assert(this.lifePeriod === LifePeriod.STARTED);
        return await this.db!.allAsync<T>(clause, ...params);
    }

    public async open<T extends object>(
        clause: string, ...params: any[]
    ): Promise<StatementIterator<T>> {
        assert(this.lifePeriod === LifePeriod.STARTED);
        const statement = await this.db!.prepareAsync<T>(clause, ...params);
        const iterator = this.step(statement);
        this.iterators.set(iterator, statement);
        this.statements.add(statement);
        return iterator;
    }

    private async *step<T extends object>(statement: Statement<T>): AsyncGenerator<T> {
        for (let row: T | null; ;) {
            assert(this.statements.has(statement));
            row = await statement.getAsync() || null;
            if (!row) break;
            yield row;
        }
    }

    public async close(iterator: StatementIterator<object>): Promise<void> {
        assert(this.lifePeriod === LifePeriod.STARTED);
        const statement = this.iterators.get(iterator);
        assert(statement);
        this.iterators.delete(iterator);
        this.statements.delete(statement);
        await statement.finalizeAsync();
    }
}

export {
    Database as default,
    Database,
}
