import Login from "./views/Login";
import DashboardIndex from "./views/dashboard/Index";
import AdminUsers from "./views/dashboard/AdminUsers";
import AdminStatistics from "./views/dashboard/AdminStatistics";
import AdminSubjects from "./views/dashboard/AdminSubjects";
import AdminSchedulePlanner from "./views/dashboard/AdminSchedulePlanner";
import TeacherSchedule from "./views/dashboard/TeacherSchedule";
import TeacherGroupPlanner from "./views/dashboard/TeacherGroupPlanner";
import StudentSchedule from "./views/dashboard/StudentSchedule";
import Settings from "./views/dashboard/Settings";
import AdminSemesterWeeks from "./views/dashboard/AdminSemesterWeeks";
import AdminStructuralData from "./views/dashboard/AdminStructuralData";

const routes = [
  {
    path: "/login",
    name: "Login",
    component: <Login />,
    layout: "/auth"
  },
  {
    path: "/index",
    name: "Dashboard",
    component: DashboardIndex,
    layout: "/dashboard"
  },
  {
    path: "/admin/users",
    name: "AdminUsers",
    component: AdminUsers,
    layout: "/dashboard"
  },
  {
    path: "/admin/subjects",
    name: "AdminSubjects",
    component: AdminSubjects,
    layout: "/dashboard"
  },
  {
    path: "/admin/schedule-planner",
    name: "AdminSchedulePlanner",
    component: AdminSchedulePlanner,
    layout: "/dashboard"
  },
  {
    path: "/admin/statistics",
    name: "AdminStatistics",
    component: AdminStatistics,
    layout: "/dashboard"
  },
  {
    path: "/admin/semester-weeks",
    name: "AdminSemesterWeeks",
    component: AdminSemesterWeeks,
    layout: "/dashboard"
  },
  {
    path: "/admin/structural-data",
    name: "AdminStructuralData",
    component: AdminStructuralData,
    layout: "/dashboard"
  },
  {
    path: "/teacher/schedule",
    name: "TeacherSchedule",
    component: TeacherSchedule,
    layout: "/dashboard"
  },
  {
    path: "/teacher/group-planner",
    name: "TeacherGroupPlanner",
    component: TeacherGroupPlanner,
    layout: "/dashboard"
  },
  {
    path: "/student/schedule",
    name: "StudentSchedule",
    component: StudentSchedule,
    layout: "/dashboard"
  },
  {
    path: "/settings",
    name: "Settings",
    component: Settings,
    layout: "/dashboard"
  }
];

export default routes;
