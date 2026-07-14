import jwt from 'jsonwebtoken';
import databaseManager from '../database.mjs'; 


const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export const userAuthMiddleware = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Missing auth token', data: null });
    }

    try {
        const decodedToken = jwt.verify(token, JWT_SECRET);
        const userId = decodedToken.id;

        const knex = await databaseManager.getKnex();
        const user = await knex('users').where({ user_id: userId }).first();
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found', data: null });
        }

        const roleRows = await knex('user_rights as ur')
            .join('roles as r', 'ur.role_id', 'r.role_id')
            .where('ur.user_id', userId)
            .select('r.role_id', 'r.name');

        req.user = {
            ...user,
            roles: roleRows
        };
        req.token = token;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid token', data: null });
    }
};
