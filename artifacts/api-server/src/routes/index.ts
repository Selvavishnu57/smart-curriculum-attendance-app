import { Router } from "express";
import authRouter from "./auth";
import departmentsRouter from "./departments";
import studentsRouter from "./students";
import facultyRouter from "./faculty";
import attendanceRouter from "./attendance";
import timetableRouter from "./timetable";
import subjectsRouter from "./subjects";
import activitiesRouter from "./activities";
import notificationsRouter from "./notifications";
import analyticsRouter from "./analytics";
import dashboardRouter from "./dashboard";
import contactsRouter from "./contacts";
import healthRouter from "./health";

const router = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(departmentsRouter);
router.use(studentsRouter);
router.use(facultyRouter);
router.use(attendanceRouter);
router.use(timetableRouter);
router.use(subjectsRouter);
router.use(activitiesRouter);
router.use(notificationsRouter);
router.use(analyticsRouter);
router.use(dashboardRouter);
router.use(contactsRouter);

export default router;
