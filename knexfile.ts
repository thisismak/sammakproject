import { Knex } from 'knex';

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: './tasks.db'
    },
    useNullAsDefault: true,
    migrations: {
      directory: './src/migrations'
    }
  }
};

export default config;