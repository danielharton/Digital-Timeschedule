import knex from 'knex';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const knexConfig = require('../../knexfile.cjs');

class DatabaseManager {
    constructor() {
        this.knex = null;
        this.isConnected = false;
    }

    async connect() {
        try {
            if (!this.knex) {
                console.log(' Connecting to database...');

                
                const environment = process.env.NODE_ENV || 'development';
                const config = knexConfig[environment];

                
                if (environment === 'development') {
                    const required = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
                    const missing = required.filter(key => !process.env[key]);

                    if (missing.length > 0) {
                        throw new Error(`Missing required environment variables: ${missing.join(', ')}. Please check your .env.local file.`);
                    }
                }

                console.log(' Database config:', {
                    environment,
                    connection: config.connection
                });

                try {
                    this.knex = knex(config);
                    await this.knex.raw('SELECT 1');
                } catch (err) {
                    if (err.code === '3D000' || err.message.includes('does not exist')) {
                        console.log(` Database ${config.connection.database} does not exist. Attempting to create it...`);
                        
                        const tempConfig = {
                            client: config.client || 'pg',
                            connection: {
                                host: process.env.DB_HOST || '127.0.0.1',
                                port: parseInt(process.env.DB_PORT) || 5432,
                                user: process.env.DB_USER || 'postgres',
                                password: process.env.DB_PASSWORD || 'root',
                                database: 'postgres'
                            }
                        };
                        const tempKnex = knex(tempConfig);
                        
                        try {
                            await tempKnex.raw(`CREATE DATABASE "${config.connection.database || process.env.DB_NAME}"`);
                            console.log(` Database ${config.connection.database || process.env.DB_NAME} created successfully.`);
                            await tempKnex.destroy();
                            
                            
                            const freshConfig = {
                                client: config.client || 'pg',
                                connection: {
                                    host: process.env.DB_HOST || '127.0.0.1',
                                    port: parseInt(process.env.DB_PORT) || 5432,
                                    user: process.env.DB_USER || 'postgres',
                                    password: process.env.DB_PASSWORD || 'root',
                                    database: process.env.DB_NAME || 'timescheduledb'
                                }
                            };
                            this.knex = knex(freshConfig);
                            await this.knex.raw('SELECT 1');
                            
                            
                            await this.knex.raw('CREATE SCHEMA IF NOT EXISTS public;');
                        } catch (createErr) {
                            await tempKnex.destroy();
                            throw createErr;
                        }
                    } else {
                        throw err;
                    }
                }
                
                this.isConnected = true;
                console.log(' Database connected successfully');

                
                try {
                    const currentDb = await this.knex.raw('SELECT current_database() as current_db');
                    console.log(' Current database:', currentDb.rows[0].current_db);
                } catch (dbError) {
                    console.log(' Could not check database:', dbError.message);
                }
            }
            return this.knex;
        } catch (error) {
            console.error(' Database connection failed:', error.message);
            console.error(' Connection error details:', error.stack);
            throw error;
        }
    }

    async disconnect() {
        try {
            if (this.knex) {
                await this.knex.destroy();
                this.knex = null;
                this.isConnected = false;
                console.log(' Database disconnected successfully');
            }
        } catch (error) {
            console.error(' Database disconnection failed:', error.message);
            throw error;
        }
    }

    async healthCheck() {
        try {
            if (!this.knex) {
                await this.connect();
            }
            await this.knex.raw('SELECT 1');
            return { status: 'healthy', connected: true };
        } catch (error) {
            return {
                status: 'unhealthy',
                connected: false,
                error: error.message
            };
        }
    }

    async getKnex() {
        if (!this.knex) {
            await this.connect();
        }
        return this.knex;
    }

    async runMigrations() {
        try {
            console.log(' Starting migrations...');
            if (!this.knex) {
                await this.connect();
            }
            console.log(' Running migrations...');
            await this.knex.migrate.latest();
            console.log(' Migrations completed successfully');
        } catch (error) {
            console.error(' Migration failed:', error.message);
            console.error(' Migration error details:', error.stack);
            throw error;
        }
    }

    async runSeeds() {
        try {
            console.log(' Starting seeds...');
            if (!this.knex) {
                await this.connect();
            }
            console.log(' Running seeds...');
            await this.knex.seed.run();
            console.log(' Seeds completed successfully');
        } catch (error) {
            console.error(' Seeding failed:', error.message);
            console.error(' Seeding error details:', error.stack);
            throw error;
        }
    }
}


const databaseManager = new DatabaseManager();


export default databaseManager;


process.on('SIGINT', async () => {
    console.log('\n Shutting down gracefully...');
    await databaseManager.disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n Shutting down gracefully...');
    await databaseManager.disconnect();
    process.exit(0);
});