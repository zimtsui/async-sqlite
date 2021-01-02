import sqlite from 'sqlite3';
import { once } from 'events';
import Bluebird from 'bluebird';
import Startable from 'startable';
import fse from 'fs-extra';
import { dirname } from 'path';
const { promisifyAll } = Bluebird;
const { ensureDir } = fse;
sqlite.verbose();

declare module 'sqlite3' {
    export interface Database {
        closeAsync(): Promise<void>;
        allAsync<T>(clause: string): Promise<T[]>;
    }
}

class Database extends Startable {
    private db!: sqlite.Database;

    constructor(private filePath: string) {
        super();
    }

    protected async _start(): Promise<void> {
        // if the containing directory doesn't exist, node-sqlite3 won't throw
        // but will exit for segment fault. here it's doomed to be thread unsafe.
        await ensureDir(dirname(this.filePath));
        this.db = promisifyAll(new sqlite.Database(this.filePath));
        await once(this.db, 'open');
        this.db.configure('busyTimeout', 1000);
        // this.db.serialize();
        await this.db.allAsync(`BEGIN IMMEDIATE;`);
    }

    protected async _stop(): Promise<void> {
        await this.db.allAsync(`COMMIT;`);
        await this.db.closeAsync();
    }

    public async sql<T = void>(clause: string): Promise<T[]> {
        return await this.db.allAsync<T>(clause);
    }
}

export {
    Database as default,
    Database,
}
