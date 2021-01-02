# Promisified SQLite

## Features

- Parallelized execution is enabled. If you execute the next statement without awaiting the previous statement, the order of executions is not guaranteed.

- All executions are wrapped in a single transaction, which is committed in `stop()`.
