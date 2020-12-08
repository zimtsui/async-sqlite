import sqlite from 'sqlite3';
import { once } from 'events';
import { promisifyAll } from 'bluebird';
import Startable from 'startable';
sqlite.verbose();

interface PromisifiedDatabase extends sqlite.Database {
    closeAsync(): Promise<void>;
    allAsync<T>(clause: string): Promise<T[]>;
};

class Database extends Startable {
    private db?: PromisifiedDatabase;

    constructor(private filePath: string) {
        super();
    }

    protected async _start(): Promise<void> {
        this.db = <PromisifiedDatabase>promisifyAll(new sqlite.Database(this.filePath));
        await once(this.db, 'open');
        this.db.configure('busyTimeout', 1000);
        // await this.db.serializeAsync();
    }

    protected async _stop(): Promise<void> {
        await this.db!.closeAsync();
    }

    public async sql<T>(clause: string): Promise<T[]> {
        return await this.db!.allAsync<T>(clause);
    }
}

export {
    Database as default,
    Database,
}
