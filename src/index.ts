import sqlite from 'sqlite3';
import { promisifyAll } from 'bluebird';
import { once } from 'events';
import { format } from 'util';
sqlite.verbose();

type PromisifiedDatabase = sqlite.Database & {
    [key: string]: any;
};

class Database {
    private db!: PromisifiedDatabase;

    constructor(private filepath: string) {

    }

    public async start(): Promise<void> {
        this.db = new sqlite.Database(this.filepath);
        promisifyAll(this.db);
        await once(this.db, 'open');
        this.db.configure('busyTimeout', 1000);
        await this.db.serializeAsync();
    }

    public async stop(): Promise<void> {
        if (this.db) await this.db.closeAsync();
    }

    public async sql(template: string, ...params: unknown[]): Promise<any> {
        const statement = format(template, ...params);
        return await this.db.allAsync(statement);
    }
}

export default Database;
export { Database };