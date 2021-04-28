import sqlite from 'sqlite3';
import { once } from 'events';
import Bluebird from 'bluebird';
import { Startable, LifePeriod } from 'startable';
import fse from 'fs-extra';
import { dirname } from 'path';
import assert from 'assert';
const { promisifyAll } = Bluebird;
const { ensureDir } = fse;
sqlite.verbose();


declare module 'sqlite3' {
    interface TypedStatement<T extends object> extends sqlite.Statement {
        getAsync(): Promise<T | undefined>;
    }
    export interface Database {
        closeAsync(): Promise<void>;
        allAsync<T extends object | null>(clause: string): Promise<T[]>;
        prepareAsync<T extends object>(clause: string): Promise<TypedStatement<T>>;
    }
}

class Database extends Startable {
    private db?: sqlite.Database;

    constructor(private filePath: string) {
        super();
    }

    protected async _start(): Promise<void> {
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

    protected async _stop(): Promise<void> {
        if (this.db) await this.db.closeAsync();
    }

    public async sql<T extends object | null = null>(clause: string): Promise<T[]> {
        assert(this.lifePeriod === LifePeriod.STARTED);
        return await this.db!.allAsync<T>(clause);
    }

    public async *step<T extends object>(clause: string): AsyncGenerator<T> {
        assert(this.lifePeriod === LifePeriod.STARTED);
        const statement = await this.db!.prepareAsync<T>(clause);
        for (let row: T | undefined; row = await statement.getAsync();) yield row;
    }
}

export {
    Database as default,
    Database,
}
