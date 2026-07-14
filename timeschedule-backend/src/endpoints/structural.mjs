import { Router } from "express";
import { userAuthMiddleware } from "../utils/middlewares/userAuthMiddleware.mjs";
import { sendJsonResponse } from "../utils/utilFunctions.mjs";
import db from "../utils/database.mjs";

const router = Router();
const hasRole = (req, roleName) => (req.user?.roles || []).some((role) => role.name === roleName);

router.use(userAuthMiddleware);

router.use((req, res, next) => {
  if (!hasRole(req, "admin")) {
    return sendJsonResponse(res, false, 403, "Not authorized", null);
  }
  next();
});

const generateCrudEndpoints = (tableName, idColumn, fields, uniqueFields = null) => {
  router.post(`/${tableName}`, async (req, res) => {
    try {
      const knex = await db.getKnex();
      const payload = {};
      for (const field of fields) {
        if (req.body[field] !== undefined) payload[field] = req.body[field];
      }

      if (uniqueFields) {
        const query = {};
        for (const uf of uniqueFields) query[uf] = payload[uf];
        const existing = await knex(tableName).where(query).first();
        if (existing) return sendJsonResponse(res, false, 400, "Duplicate entry exists", null);
      }

      const [id] = await knex(tableName).insert(payload).returning(idColumn);
      return sendJsonResponse(res, true, 200, `Created in ${tableName}`, { id });
    } catch (error) {
      return sendJsonResponse(res, false, 500, "Failed to create", { details: error.message });
    }
  });

  router.put(`/${tableName}/:id`, async (req, res) => {
    try {
      const knex = await db.getKnex();
      const payload = {};
      for (const field of fields) {
        if (req.body[field] !== undefined) payload[field] = req.body[field];
      }

      if (uniqueFields) {
        const query = {};
        for (const uf of uniqueFields) query[uf] = payload[uf];
        const existing = await knex(tableName).where(query).whereNot(idColumn, req.params.id).first();
        if (existing) return sendJsonResponse(res, false, 400, "Duplicate entry exists", null);
      }

      payload.updated_at = knex.fn.now();
      await knex(tableName).where({ [idColumn]: req.params.id }).update(payload);
      return sendJsonResponse(res, true, 200, `Updated in ${tableName}`, null);
    } catch (error) {
      return sendJsonResponse(res, false, 500, "Failed to update", { details: error.message });
    }
  });

  router.delete(`/${tableName}/:id`, async (req, res) => {
    try {
      const knex = await db.getKnex();
      await knex(tableName).where({ [idColumn]: req.params.id }).del();
      return sendJsonResponse(res, true, 200, `Deleted from ${tableName}`, null);
    } catch (error) {
      return sendJsonResponse(res, false, 500, "Failed to delete", { details: error.message });
    }
  });
};

generateCrudEndpoints(
  "study_programs",
  "program_id",
  ["program_name", "faculty_name", "university_name", "cycle", "duration_years"],
  ["program_name", "faculty_name", "university_name", "cycle", "duration_years"]
);
generateCrudEndpoints("buildings", "building_id", ["building_code", "name"]);
generateCrudEndpoints("rooms", "room_id", ["room_code", "capacity", "building_id"]);

export default router;
