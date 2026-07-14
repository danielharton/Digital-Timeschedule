
require('dotenv').config({ path: './.env.local' });

module.exports = {
    
    
    development: {
        client: 'pg',
        connection: {
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        },
        pool: {
            min: 2,
            max: 10
        },
        debug: process.env.NODE_ENV === 'development'
    },

    
    
    production: {
        client: 'pg',
        connection: process.env.DATABASE_URL,
        
        ssl: { rejectUnauthorized: false },
        
        
        pool: {
            min: 2,
            max: 10
        },
        migrations: {
            directory: './migrations'
        },
        seeds: {
            directory: './seeds'
        }
    }
};