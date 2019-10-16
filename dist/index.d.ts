declare class Database {
    private filepath;
    private db;
    constructor(filepath: string);
    start(): Promise<void>;
    stop(): Promise<void>;
    sql(template: string, ...params: unknown[]): Promise<any>;
}
export default Database;
export { Database };
