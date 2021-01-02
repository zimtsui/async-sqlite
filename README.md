# Promisified SQLite

## Features

- Parallelized execution is enabled. If you execute the next statement without awaiting the previous statement, the order of executions is not guaranteed.

- All executions are wrapped in a single transaction, which is committed in `stop()`.

## Streaming SELECT

[node-sqlite3](https://github.com/mapbox/node-sqlite3) is just a nodejs binding for sqlite, and this library is also just a promisified binding for sqlite. Even the sqlite program itself doesn't offer an interface for streaming SELECT. A binding should have the same interfaces as the original program.

It's a fact that streaming SELECT is important and common-used, but it should be implemented in an upper-level library which uses the binding as a dependency, rather than implemented by binding itself.
