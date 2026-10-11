import pg from 'pg';

const { Client } = pg;

export class PostgresAdapter {
    constructor() {
        /**
         * @type {pg.Client | null}
         */
        this.conn = null;
        /**
         * @type {string}
         */
        this.database = '';
        /**
         * @type {string}
         */
        this.schema = 'public';
    }

    async connect(credentials) {
        try {
            const { schema, ...config } = credentials;
            this.conn = new Client(config);
            await this.conn.connect();
            this.database = config.database;
            this.schema = schema || 'public';
        } catch (err) {
            console.log('Error while establishing connection ===>', err);
        }
    }

    async getSchema() {
        try {
            const { rows: columns } = await this.conn.query(
                `SELECT 
                    table_name  AS "TABLE_NAME",
                    column_name AS "COLUMN_NAME",
                    CASE
                        WHEN character_maximum_length IS NOT NULL
                            THEN data_type || '(' || character_maximum_length || ')'
                        WHEN data_type = 'numeric' AND numeric_precision IS NOT NULL
                            THEN data_type || '(' || numeric_precision || ',' || COALESCE(numeric_scale, 0) || ')'
                        WHEN data_type IN ('USER-DEFINED', 'ARRAY')
                            THEN udt_name
                        ELSE data_type
                    END AS "COLUMN_TYPE",
                    is_nullable AS "IS_NULLABLE"
                FROM information_schema.columns
                WHERE table_catalog = $1 AND table_schema = $2
                ORDER BY table_name, ordinal_position`,
                [this.database, this.schema]
            );

            const { rows: relations } = await this.conn.query(
                `SELECT 
                    kcu.table_name  AS "TABLE_NAME",
                    kcu.column_name AS "COLUMN_NAME",
                    ccu.table_name  AS "REFERENCED_TABLE_NAME",
                    ccu.column_name AS "REFERENCED_COLUMN_NAME"
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.constraint_schema = kcu.constraint_schema
                JOIN information_schema.constraint_column_usage ccu
                    ON tc.constraint_name = ccu.constraint_name
                    AND tc.constraint_schema = ccu.constraint_schema
                WHERE tc.constraint_type = 'FOREIGN KEY'
                    AND tc.constraint_catalog = $1
                    AND tc.constraint_schema = $2`,
                [this.database, this.schema]
            );

            console.log(columns);

            return { columns, relations };
        } catch (err) {
            console.log('Error while fetching schema ===>', err);
        }
    }

    async close() {
        await this.conn?.end();
    }
}
