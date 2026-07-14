const defaults = {
  en: {
    "menu.admin_users": "Manage users",
    "menu.admin_subjects": "Manage subjects",
    "menu.schedule_planner": "Schedule Planner",
    "menu.academic_weeks": "Academic Weeks",
    "menu.admin_statistics": "Statistics",
    "menu.teacher_schedule": "Teacher Schedule",
    "menu.teacher_group_planner": "Group Planner",
    "menu.student_schedule": "My Timetable",
    "menu.settings": "Settings",
    "settings.language": "Language",
    "settings.save": "Save"
  },
  ro: {
    "menu.admin_users": "Gestionarea utilizatorilor",
    "menu.admin_subjects": "Gestionare materii",
    "menu.schedule_planner": "Planificator Orar",
    "menu.academic_weeks": "Săptămâni Academice",
    "menu.admin_statistics": "Statistici",
    "menu.teacher_schedule": "Orar Profesor",
    "menu.teacher_group_planner": "Planificator Grupe",
    "menu.student_schedule": "Orarul Meu",
    "menu.settings": "Setari",
    "settings.language": "Limba",
    "settings.save": "Salveaza"
  }
};

export const getLocalizationState = () => {
  const raw = localStorage.getItem("app_language_state");
  if (!raw) return { mode: "en", customPack: null };
  try {
    return JSON.parse(raw);
  } catch (_err) {
    return { mode: "en", customPack: null };
  }
};

export const setLocalizationState = (state) => {
  localStorage.setItem("app_language_state", JSON.stringify(state));
};

export const t = (key, fallback = "") => {
  const state = getLocalizationState();
  if (state.mode === "custom" && state.customPack && state.customPack[key]) {
    return state.customPack[key];
  }
  const pack = defaults[state.mode] || defaults.en;
  return pack[key] || fallback || key;
};
