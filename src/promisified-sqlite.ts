import sqlite from 'sqlite3';
import { once } from 'events';
import { Readable, Writable } from 'stream';
import { promisifyAll } from 'bluebird';
import Startable from 'startable';
sqlite.verbose();

type PromisifiedDatabase = sqlite.Database & {
    [key: string]: any;
};
type PromisifiedStatement = sqlite.Statement & {
    [key: string]: any;
};

class Database extends Startable {
    private db?: PromisifiedDatabase;

    constructor(private filepath: string) {
        super();
    }

    protected async _start(): Promise<void> {
        this.db = new sqlite.Database(this.filepath);
        promisifyAll(this.db);
        await once(this.db, 'open');
        this.db.configure('busyTimeout', 1000);
        // await this.db.serializeAsync();
    }

    protected async _stop(): Promise<void> {
        if (this.db) await this.db.closeAsync();
    }

    public async sql(clause: string): Promise<unknown> {
        return await this.db!.allAsync(clause);
    }

    public selectAsStream(clause: string) {
        const statement = <PromisifiedStatement>promisifyAll(
            this.db!.prepare(clause),
        );
        return new Readable({
            async read() {
                try {
                    while (this.push((
                        await statement.getAsync()
                    ) || null));
                } catch (err) {
                    this.destroy(err);
                }
            },
            destroy(err, cb) {
                statement.finalize(cb);
            },
        });
    }

    public insertAsStream(tableName: string, columnsNames: string[]) {
        return new Writable({
            write: (row: unknown[], encoding, cb) => {
                const stringifiedRow = row.map((item): string => {
                    if (typeof item === 'string') return `'${item}'`;
                    if (typeof item === 'number') return String(item);
                    if (typeof item === 'boolean') return item ? 'TRUE' : 'FALSE';
                    throw new Error('Unsupported type.');
                });
                this.db!.run(
                    `INSERT INTO "${tableName}" (${
                    columnsNames.map(name => `"${name}"`).join(',')
                    }) VALUES (${
                    stringifiedRow.join(',')
                    });`,
                    cb,
                );
            }
        });
    }
}

export {
    Database as default,
    Database,
}