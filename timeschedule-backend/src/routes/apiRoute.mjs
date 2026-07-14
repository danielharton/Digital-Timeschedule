import { Router } from "express";
import users from '../endpoints/users.mjs'
import rights from '../endpoints/rights.mjs'
import timetable from '../endpoints/timetable.mjs'
import structural from '../endpoints/structural.mjs'

const router = Router();

router.use('/users/', users)
router.use('/rights/', rights)
router.use('/timetable/', timetable)
router.use('/structural/', structural)

export default router;

