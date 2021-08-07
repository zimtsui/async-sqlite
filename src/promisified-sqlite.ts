import sqlite = require('sqlite3');
import { Statement } from 'sqlite3';
import { once } from 'events';
import Bluebird = require('bluebird');
import { Startable, ReadyState } from 'startable';
import assert = require('assert');
const { promisifyAll } = Bluebird;
sqlite.verbose();

declare module 'sqlite3' {
    export interface Statement<T extends {} = any> {
        getAsync(): Promise<T | undefined>;
        finalizeAsync(): Promise<void>;
    }
    export interface Database {
        closeAsync(): Promise<void>;
        allAsync<T extends {} | null>(clause: string, ...params: any[]): Promise<T[]>;
        prepareAsync<T extends {}>(clause: string, ...params: any[]): Promise<Statement<T>>;
    }
}

class Database extends Startable {
    private db?: sqlite.Database;
    // WeakMap 属于元编程，最好不用
    private iterables = new Map<AsyncIterable<{}>, Statement<{}>>();
    private statements = new Set<Statement<{}>>();

    constructor(private filePath: string) {
        super();
    }

    protected async _start(): Promise<void> {
        // 如果打开过程中发生错误，比如目录不存在，也不会抛出异常。
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

    public async sql<T extends {} | null = null>(
        clause: string, ...params: any[]
    ): Promise<T[]> {
        assert(this.readyState === ReadyState.STARTED);
        return await this.db!.allAsync<T>(clause, ...params);
    }

    public async open<T extends {}>(
        clause: string, ...params: any[]
    ): Promise<AsyncIterable<T>> {
        assert(this.readyState === ReadyState.STARTED);
        const statement = await this.db!.prepareAsync<T>(clause, ...params);
        const iterable = this.step(statement);
        this.iterables.set(iterable, statement);
        this.statements.add(statement);
        return iterable;
    }

    private async *step<T extends {}>(statement: Statement<T>): AsyncIterable<T> {
        for (let row: T | null; ;) {
            assert(this.statements.has(statement));
            row = await statement.getAsync() || null;
            if (!row) break;
            yield row;
        }
    }

    public async close(iterator: AsyncIterable<{}>): Promise<void> {
        assert(this.readyState === ReadyState.STARTED);
        const statement = this.iterables.get(iterator);
        assert(statement);
        this.iterables.delete(iterator);
        this.statements.delete(statement);
        await statement.finalizeAsync();
    }
}

export {
    Database,
}
