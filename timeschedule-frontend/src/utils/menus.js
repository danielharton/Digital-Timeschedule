import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import GroupIcon from "@mui/icons-material/Group";
import SettingsIcon from "@mui/icons-material/Settings";
import EventIcon from "@mui/icons-material/Event";
import EditCalendarIcon from "@mui/icons-material/EditCalendar";
import MenuBookIcon from '@mui/icons-material/MenuBook';
import BarChartIcon from '@mui/icons-material/BarChart';
import DomainIcon from '@mui/icons-material/Domain';
import { RIGHTS_MAPPING } from "./utilConstants";
import { t } from "./localization";

export const menus = [
  {
    id: 1,
    parentId: null,
    name: t("menu.admin_users", "Manage users"),
    to: "/dashboard/admin/users",
    icon: GroupIcon,
    isCategory: false,
    excludelocationsType: [],
    rights: [RIGHTS_MAPPING.ADMIN],
    order: 1,
    children: []
  },
  {
    id: 8,
    parentId: null,
    name: t("menu.admin_subjects", "Manage subjects"),
    to: "/dashboard/admin/subjects",
    icon: MenuBookIcon,
    isCategory: false,
    excludelocationsType: [],
    rights: [RIGHTS_MAPPING.ADMIN],
    order: 1.5,
    children: []
  },
  {
    id: 7,
    parentId: null,
    name: t("menu.schedule_planner", "Schedule Planner"),
    to: "/dashboard/admin/schedule-planner",
    icon: EditCalendarIcon,
    isCategory: false,
    excludelocationsType: [],
    rights: [RIGHTS_MAPPING.ADMIN],
    order: 2,
    children: []
  },
  {
    id: 6,
    parentId: null,
    name: t("menu.academic_weeks", "Academic Weeks"),
    to: "/dashboard/admin/semester-weeks",
    icon: EventIcon,
    isCategory: false,
    excludelocationsType: [],
    rights: [RIGHTS_MAPPING.ADMIN],
    order: 3,
    children: []
  },
  {
    id: 9,
    parentId: null,
    name: t("menu.admin_statistics", "Statistics"),
    to: "/dashboard/admin/statistics",
    icon: BarChartIcon,
    isCategory: false,
    excludelocationsType: [],
    rights: [RIGHTS_MAPPING.ADMIN],
    order: 3.5,
    children: []
  },
  {
    id: 10,
    parentId: null,
    name: t("menu.admin_structural", "Structural Data"),
    to: "/dashboard/admin/structural-data",
    icon: DomainIcon,
    isCategory: false,
    excludelocationsType: [],
    rights: [RIGHTS_MAPPING.ADMIN],
    order: 3.6,
    children: []
  },
  {
    id: 2,
    parentId: null,
    name: t("menu.teacher_schedule", "Teacher Schedule"),
    to: "/dashboard/teacher/schedule",
    icon: CalendarMonthIcon,
    isCategory: false,
    excludelocationsType: [],
    rights: [RIGHTS_MAPPING.TEACHER],
    order: 4,
    children: []
  },
  {
    id: 3,
    parentId: null,
    name: t("menu.student_schedule", "My Timetable"),
    to: "/dashboard/student/schedule",
    icon: CalendarMonthIcon,
    isCategory: false,
    excludelocationsType: [],
    rights: [RIGHTS_MAPPING.STUDENT],
    order: 5,
    children: []
  },
  {
    id: 4,
    parentId: null,
    name: t("menu.teacher_group_planner", "Group Planner"),
    to: "/dashboard/teacher/group-planner",
    icon: GroupIcon,
    isCategory: false,
    excludelocationsType: [],
    rights: [RIGHTS_MAPPING.TEACHER],
    order: 6,
    children: []
  },
  {
    id: 5,
    parentId: null,
    name: t("menu.settings", "Settings"),
    to: "/dashboard/settings",
    icon: SettingsIcon,
    isCategory: false,
    excludelocationsType: [],
    rights: [RIGHTS_MAPPING.ADMIN, RIGHTS_MAPPING.TEACHER, RIGHTS_MAPPING.STUDENT],
    order: 50,
    children: []
  }
];
