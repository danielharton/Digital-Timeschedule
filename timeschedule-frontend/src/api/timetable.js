import { getToken } from "../utils/utilFunctions";
import { getApiBaseUrl } from "../utils/apiBaseUrl";

const apiUrl = getApiBaseUrl();

export const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`
});

const parseResponse = async (response) => {
  const data = await response.json();
  if (response.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    return;
  }
  if (!response.ok || !data.success) {
    throw new Error(data?.message || "Request failed");
  }
  return data.data;
};

export const apiGetMeta = async () => {
  const response = await fetch(`${apiUrl}/api/timetable/meta`, {
    method: "GET",
    headers: getHeaders()
  });
  return parseResponse(response);
};

export const apiGetTeacherSchedule = async () => {
  const response = await fetch(`${apiUrl}/api/timetable/teacher/my-schedule`, {
    method: "GET",
    headers: getHeaders()
  });
  return parseResponse(response);
};

export const apiGetStudentSchedule = async () => {
  const response = await fetch(`${apiUrl}/api/timetable/student/my-schedule`, {
    method: "GET",
    headers: getHeaders()
  });
  return parseResponse(response);
};



export const apiCreateBuilding = async (payload) => {
  const response = await fetch(`${apiUrl}/api/structural/buildings`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  return parseResponse(response);
};

export const apiCreateRoom = async (payload) => {
  const response = await fetch(`${apiUrl}/api/structural/rooms`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  return parseResponse(response);
};



export const apiSearchTeacherGroups = async (query) => {
  const response = await fetch(`${apiUrl}/api/timetable/teacher/groups/search?q=${encodeURIComponent(query || "")}`, {
    method: "GET",
    headers: getHeaders()
  });
  return parseResponse(response);
};

export const apiGetTeacherGroupSchedule = async (groupId) => {
  const response = await fetch(`${apiUrl}/api/timetable/teacher/group-schedule?group_id=${groupId}`, {
    method: "GET",
    headers: getHeaders()
  });
  return parseResponse(response);
};

export const apiGetHistory = async () => {
  const response = await fetch(`${apiUrl}/api/timetable/history`, {
    method: "GET",
    headers: getHeaders()
  });
  return parseResponse(response);
};



export const apiGetUsers = async (q = "") => {
  const response = await fetch(`${apiUrl}/api/users/getUsers?q=${encodeURIComponent(q)}`, {
    method: "GET",
    headers: getHeaders(),
    cache: "no-store"
  });
  return parseResponse(response);
};

export const apiCreateUser = async (payload) => {
  const response = await fetch(`${apiUrl}/api/users/create`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  return parseResponse(response);
};

export const apiDeleteUser = async (userId) => {
  const response = await fetch(`${apiUrl}/api/users/deleteUser/${userId}`, {
    method: "DELETE",
    headers: getHeaders()
  });
  return parseResponse(response);
};

export const apiUpdateUser = async (userId, payload) => {
  const response = await fetch(`${apiUrl}/api/users/update/${userId}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  return parseResponse(response);
};

export const apiGetTeachers = async () => {
  const response = await fetch(`${apiUrl}/api/users/getTeachers`, {
    method: "GET",
    headers: getHeaders(),
    cache: "no-store"
  });
  return parseResponse(response);
};



export const apiAssignAccounts = async (payload) => {
  const response = await fetch(`${apiUrl}/api/users/assignAccounts`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  return parseResponse(response);
};



export const apiBulkDeleteUsers = async (payload) => {
  const response = await fetch(`${apiUrl}/api/users/bulkDelete`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  return parseResponse(response);
};

export const apiGetUserSettings = async () => {
  const response = await fetch(`${apiUrl}/api/users/settings`, {
    method: "GET",
    headers: getHeaders()
  });
  return parseResponse(response);
};

export const apiSetLanguagePreference = async (payload) => {
  const response = await fetch(`${apiUrl}/api/users/settings/language`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  return parseResponse(response);
};

export const apiDownloadEnglishLanguageTemplate = async () => {
  const response = await fetch(`${apiUrl}/api/users/settings/english-template-download`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  });
  if (!response.ok) throw new Error("Failed to download english json template");
  return response.blob();
};

export const apiGetAssociations = async (userId) => {
  const response = await fetch(`${apiUrl}/api/users/associations?user_id=${userId}`, {
    method: "GET",
    headers: getHeaders(),
    cache: "no-store"
  });
  return parseResponse(response);
};

export const apiDeleteAssociation = async (payload) => {
  const response = await fetch(`${apiUrl}/api/users/associations`, {
    method: "DELETE",
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  return parseResponse(response);
};



export const apiGetSemesterWeeks = async (semesterId) => {
  const query = semesterId ? `?semester_id=${semesterId}` : "";
  const response = await fetch(`${apiUrl}/api/timetable/admin/semester-weeks${query}`, {
    method: "GET",
    headers: getHeaders()
  });
  return parseResponse(response);
};

export const apiSaveSemesterWeeks = async (payload) => {
  const response = await fetch(`${apiUrl}/api/timetable/admin/semester-weeks`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  return parseResponse(response);
};

export const apiSetSubjectOnlineLink = async (payload) => {
  const response = await fetch(`${apiUrl}/api/timetable/admin/subject-link`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  return parseResponse(response);
};

export const apiGetTeacherSubjects = async () => {
  const response = await fetch(`${apiUrl}/api/users/teacher-subjects`, {
    method: "GET",
    headers: getHeaders()
  });
  return parseResponse(response);
};

export const apiAssignTeacherSubject = async (payload) => {
  const response = await fetch(`${apiUrl}/api/users/teacher-subjects`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  return parseResponse(response);
};

export const apiDeleteTeacherSubject = async (subjectTeacherId) => {
  const response = await fetch(`${apiUrl}/api/users/teacher-subjects/${subjectTeacherId}`, {
    method: "DELETE",
    headers: getHeaders()
  });
  return parseResponse(response);
};

export const apiGetSubjects = async () => {
  const response = await fetch(`${apiUrl}/api/users/subjects`, {
    method: "GET",
    headers: getHeaders()
  });
  return parseResponse(response);
};

export const apiCreateSubject = async (payload) => {
  const response = await fetch(`${apiUrl}/api/users/subjects`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  return parseResponse(response);
};

export const apiUpdateSubject = async (subjectId, payload) => {
  const response = await fetch(`${apiUrl}/api/users/subjects/${subjectId}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  return parseResponse(response);
};

export const apiDeleteSubject = async (subjectId) => {
  const response = await fetch(`${apiUrl}/api/users/subjects/${subjectId}`, {
    method: "DELETE",
    headers: getHeaders()
  });
  return parseResponse(response);
};

export const apiGetScopes = async (subjectTeacherId) => {
  const query = subjectTeacherId ? `?subject_teacher_id=${subjectTeacherId}` : "";
  const response = await fetch(`${apiUrl}/api/timetable/admin/teacher-activity-scopes${query}`, {
    method: "GET",
    headers: getHeaders()
  });
  return parseResponse(response);
};

export const apiCreateScope = async (payload) => {
  const response = await fetch(`${apiUrl}/api/timetable/admin/teacher-activity-scopes`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  return parseResponse(response);
};

export const apiDeleteScope = async (scopeId) => {
  const response = await fetch(`${apiUrl}/api/timetable/admin/teacher-activity-scopes/${scopeId}`, {
    method: "DELETE",
    headers: getHeaders()
  });
  return parseResponse(response);
};



export const apiGetAdminSchedule = async (params = {}) => {
  const qs = new URLSearchParams();
  if (params.group_id) qs.set("group_id", params.group_id);
  if (params.series) qs.set("series", params.series);
  if (params.teacher_id) qs.set("teacher_id", params.teacher_id);
  const response = await fetch(`${apiUrl}/api/timetable/admin/schedule?${qs}`, {
    method: "GET",
    headers: getHeaders()
  });
  return parseResponse(response);
};

export const apiAdminCreateEntry = async (payload) => {
  const response = await fetch(`${apiUrl}/api/timetable/admin/entry`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  return parseResponse(response);
};

export const apiAdminReplaceEntry = async (scheduleEntryId, payload) => {
  const response = await fetch(`${apiUrl}/api/timetable/admin/entry/replace/${scheduleEntryId}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  return parseResponse(response);
};

export const apiAdminDeleteEntry = async (scheduleEntryId) => {
  const response = await fetch(`${apiUrl}/api/timetable/admin/entry/${scheduleEntryId}`, {
    method: "DELETE",
    headers: getHeaders()
  });
  return parseResponse(response);
};

export const apiAdminCheckOverlap = async (payload) => {
  const response = await fetch(`${apiUrl}/api/timetable/admin/entry/check-overlap`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  return parseResponse(response);
};

export const apiAdminCheckDuplicate = async (payload) => {
  const response = await fetch(`${apiUrl}/api/timetable/admin/entry/check-duplicate`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload)
  });
  return parseResponse(response);
};

export const apiGetAdminStatistics = async () => {
  const response = await fetch(`${apiUrl}/api/timetable/admin/statistics`, {
    method: "GET",
    headers: getHeaders()
  });
  return parseResponse(response);
};
