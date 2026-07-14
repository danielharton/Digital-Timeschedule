import { Router } from "express";
import { userAuthMiddleware } from "../utils/middlewares/userAuthMiddleware.mjs";
import { sendJsonResponse } from "../utils/utilFunctions.mjs";
import db from "../utils/database.mjs";

const router = Router();

const rightCodeByRole = {
  teacher: 1,
  student: 2,
  admin: 3
};

router.get("/getUserRights", userAuthMiddleware, async (req, res) => {
  try {
    const knex = await db.getKnex();
    const roleRows = await knex("user_rights as ur")
      .join("roles as r", "ur.role_id", "r.role_id")
      .where("ur.user_id", req.user.user_id)
      .select("r.role_id", "r.name");

    const payload = roleRows.map((role) => ({
      role_id: role.role_id,
      name: role.name,
      right_code: rightCodeByRole[role.name] || 0
    }));

    return sendJsonResponse(res, true, 200, "User rights fetched", payload);
  } catch (error) {
    return sendJsonResponse(res, false, 500, "Internal server error", { details: error.message });
  }
});

export default router;
