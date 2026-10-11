import mysql2 from 'mysql2/promise';
import { AppError } from '../utils/AppError.js';

export class MySqlAdapter {
    constructor() {
        /**
         * @type {mysql2.Connection | null}
         */
        this.conn = null;
        /**
         * @type {string}
         */
        this.database = '';
    }

    async connect(credentials) {
        try {
            this.conn = await mysql2.createConnection(credentials);
            this.database = credentials.database;
        } catch (err) {
            console.log('Error while establishing connection ===>', err);
            throw new AppError('Unable to connect to the database', '60');
        }
    }

    async getSchema() {
        try {
            const [columns] = await this.conn.execute(
                `SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = ?`,
                [this.database]
            );

            const [relations] = await this.conn.execute(
                `SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
                FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                WHERE CONSTRAINT_SCHEMA = ? and CONSTRAINT_NAME LIKE 'FK%'`,
                [this.database]
            );

            return { columns, relations };
        } catch (err) {
            console.log('Error while fetching schema ===>', err);
            throw new AppError('Unable to parse the schema', '59');
        }
    }

    async close() {
        await this.conn?.end();
    }
}
