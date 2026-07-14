import { useCallback, useEffect, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import LinkIcon from "@mui/icons-material/Link";
import { showErrorToast, showSuccessToast } from "../../utils/utilFunctions";
import {
  apiCreateSubject,
  apiAssignTeacherSubject,
  apiDeleteSubject,
  apiDeleteTeacherSubject,
  apiGetMeta,
  apiGetSubjects,
  apiGetTeacherSubjects,
  apiGetTeachers,
  apiSetSubjectOnlineLink,
  apiUpdateSubject,
  apiGetScopes,
  apiCreateScope,
  apiDeleteScope
} from "../../api/timetable";
import GenericTable from "../../components/GenericTable";

const AdminSubjects = () => {
  const [meta, setMeta] = useState({ groups: [], subject_teachers: [] });
  const [teachers, setTeachers] = useState([]);
  const [teacherSubjects, setTeacherSubjects] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [scopes, setScopes] = useState([]);
  const [subjectForm, setSubjectForm] = useState({ subject_id: "", name: "" });
  const [teacherSubjectForm, setTeacherSubjectForm] = useState({ teacher_id: "", subject_id: "", activity_type: "course" });
  const [scopeForm, setScopeForm] = useState({
    subject_teacher_id: "",
    scope_kind: "group",
    group_id: "",
    series_letter: ""
  });
  const [linkForm, setLinkForm] = useState({
    subject_teacher_id: "",
    activity_type: "course",
    target_type: "group",
    group_id: "",
    series: "",
    online_url: ""
  });

  const refreshAdminReferences = useCallback(async (silent = false) => {
    try {
      const [metaData, teachersData, teacherSubjectsData, subjectsData, scopesData] = await Promise.all([
        apiGetMeta(),
        apiGetTeachers(),
        apiGetTeacherSubjects(),
        apiGetSubjects(),
        apiGetScopes()
      ]);
      setMeta(metaData);
      setTeachers(teachersData);
      setTeacherSubjects(
        (teacherSubjectsData || []).map((row) => ({
          ...row,
          teacher_full_name: [row.first_name, row.last_name].filter(Boolean).join(" ")
        }))
      );
      setSubjects(subjectsData);
      setScopes(scopesData || []);
      return metaData;
    } catch (error) {
      if (!silent) showErrorToast(error.message);
      return null;
    }
  }, []);

  useEffect(() => {
    refreshAdminReferences()
      .then((metaData) => {
        setLinkForm((prev) => ({
          ...prev,
          subject_teacher_id: prev.subject_teacher_id || metaData?.subject_teachers?.[0]?.subject_teacher_id || "",
          group_id: prev.group_id || metaData?.groups?.[0]?.group_id || ""
        }));
      })
      .catch(() => { });
  }, [refreshAdminReferences]);

  useEffect(() => {
    const interval = setInterval(async () => {
      await refreshAdminReferences(true);
    }, 1000);
    return () => clearInterval(interval);
  }, [refreshAdminReferences]);

  useEffect(() => {
    const syncOnFocus = async () => {
      await refreshAdminReferences(true);
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void syncOnFocus();
      }
    };

    window.addEventListener("focus", syncOnFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", syncOnFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshAdminReferences]);

  const saveOnlineLink = async () => {
    try {
      await apiSetSubjectOnlineLink({
        subject_teacher_id: Number(linkForm.subject_teacher_id),
        activity_type: linkForm.activity_type,
        group_id: linkForm.target_type === "group" ? Number(linkForm.group_id) : null,
        series: linkForm.target_type === "series" ? linkForm.series : null,
        online_url: linkForm.online_url
      });
      showSuccessToast("Online link saved");
      setLinkForm((prev) => ({ ...prev, online_url: "" }));
    } catch (error) {
      showErrorToast(error.message);
    }
  };

  const saveTeacherSubject = async () => {
    try {
      await apiAssignTeacherSubject({
        teacher_id: Number(teacherSubjectForm.teacher_id),
        subject_id: Number(teacherSubjectForm.subject_id),
        activity_type: teacherSubjectForm.activity_type
      });
      showSuccessToast("Teacher subject saved");
      await refreshAdminReferences();
    } catch (error) {
      showErrorToast(error.message);
    }
  };

  const removeTeacherSubject = async (subjectTeacherId) => {
    try {
      await apiDeleteTeacherSubject(subjectTeacherId);
      showSuccessToast("Teacher subject deleted");
      await refreshAdminReferences();
    } catch (error) {
      showErrorToast(error.message);
    }
  };

  const saveSubject = async () => {
    try {
      if (!subjectForm.name) {
        showErrorToast("Subject name is required");
        return;
      }
      if (subjectForm.subject_id) {
        await apiUpdateSubject(subjectForm.subject_id, { name: subjectForm.name });
        showSuccessToast("Subject updated");
      } else {
        await apiCreateSubject({ name: subjectForm.name });
        showSuccessToast("Subject created");
      }
      setSubjectForm({ subject_id: "", name: "" });
      await refreshAdminReferences();
    } catch (error) {
      showErrorToast(error.message);
    }
  };

  const editSubject = (subject) => setSubjectForm({ subject_id: subject.subject_id, name: subject.name });

  const removeSubject = async (subjectId) => {
    try {
      await apiDeleteSubject(subjectId);
      showSuccessToast("Subject deleted");
      await refreshAdminReferences();
    } catch (error) {
      showErrorToast(error.message);
    }
  };

  const saveScope = async () => {
    try {
      await apiCreateScope(scopeForm);
      showSuccessToast("Scope created");
      await refreshAdminReferences();
    } catch (error) {
      showErrorToast(error.message);
    }
  };

  const removeScope = async (scopeId) => {
    try {
      await apiDeleteScope(scopeId);
      showSuccessToast("Scope deleted");
      await refreshAdminReferences();
    } catch (error) {
      showErrorToast(error.message);
    }
  };

  return (
    <Box sx={{ width: "100%", minWidth: 0, overflow: "visible" }}>
      <Typography variant="h5" component="h1" sx={{ mb: 2 }}>
        Admin - Subjects Management
      </Typography>

      <Typography variant="h6" sx={{ mt: 3 }}>Subjects management</Typography>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
        <TextField size="small" label="Subject name" value={subjectForm.name} onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })} sx={{ minWidth: 280 }} />
        <Button variant="contained" onClick={saveSubject}>{subjectForm.subject_id ? "Update subject" : "Create subject"}</Button>
      </Stack>
      <GenericTable
        data={(subjects || []).map((x) => ({ ...x, id: x.subject_id }))}
        columns={[{ field: "name", headerName: "Subject" }]}
        actions={[
          { icon: <LinkIcon />, color: "#1565c0", onClick: (_id, row) => editSubject(row) },
          { icon: <DeleteIcon />, color: "#0d47a1", onClick: (_id, row) => removeSubject(row.subject_id) }
        ]}
      />

      <Typography variant="h6" sx={{ mt: 3 }}>Set online.ase.ro link for teacher activity</Typography>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
        <FormControl size="small" sx={{ minWidth: 260 }}>
          <InputLabel>Teacher subject</InputLabel>
          <Select
            value={linkForm.subject_teacher_id}
            label="Teacher subject"
            onChange={(e) => setLinkForm({ ...linkForm, subject_teacher_id: e.target.value })}
          >
            {(meta.subject_teachers || []).map((st) => (
              <MenuItem key={st.subject_teacher_id} value={st.subject_teacher_id}>
                {st.subject_name} ({st.activity_type}) - {st.first_name} {st.last_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Type</InputLabel>
          <Select value={linkForm.activity_type} label="Type" onChange={(e) => setLinkForm({ ...linkForm, activity_type: e.target.value })}>
            <MenuItem value="course">course</MenuItem>
            <MenuItem value="seminar">seminar</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Target</InputLabel>
          <Select value={linkForm.target_type} label="Target" onChange={(e) => setLinkForm({ ...linkForm, target_type: e.target.value })}>
            <MenuItem value="group">group</MenuItem>
            <MenuItem value="series">series</MenuItem>
          </Select>
        </FormControl>
        {linkForm.target_type === "group" ? (
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Group</InputLabel>
            <Select value={linkForm.group_id} label="Group" onChange={(e) => setLinkForm({ ...linkForm, group_id: e.target.value })}>
              {(meta.groups || []).map((group) => (
                <MenuItem key={group.group_id} value={group.group_id}>{group.group_name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <Autocomplete
            freeSolo
            options={[...new Set((meta.groups || []).map((g) => g.series).filter(Boolean))]}
            value={linkForm.series}
            onChange={(_e, value) => setLinkForm({ ...linkForm, series: value || "" })}
            onInputChange={(_e, value) => setLinkForm({ ...linkForm, series: value || "" })}
            renderInput={(params) => <TextField {...params} size="small" label="Series" />}
            sx={{ minWidth: 160 }}
          />
        )}
        <TextField size="small" label="online.ase.ro link" value={linkForm.online_url} onChange={(e) => setLinkForm({ ...linkForm, online_url: e.target.value })} sx={{ minWidth: 260 }} />
        <Button variant="contained" onClick={saveOnlineLink}>Save link</Button>
      </Stack>

      <Typography variant="h6" sx={{ mt: 3 }}>Assign subjects to teachers</Typography>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
        <FormControl size="small" sx={{ minWidth: 240 }}>
          <InputLabel>Teacher</InputLabel>
          <Select
            value={teacherSubjectForm.teacher_id}
            label="Teacher"
            onChange={(e) => setTeacherSubjectForm({ ...teacherSubjectForm, teacher_id: e.target.value })}
          >
            {teachers.map((teacher) => (
              <MenuItem key={teacher.user_id} value={teacher.user_id}>
                {[teacher.first_name, teacher.last_name].filter(Boolean).join(" ")}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 240 }}>
          <InputLabel>Subject</InputLabel>
          <Select
            value={teacherSubjectForm.subject_id}
            label="Subject"
            onChange={(e) => setTeacherSubjectForm({ ...teacherSubjectForm, subject_id: e.target.value })}
          >
            {(meta.subjects || []).map((subject) => (
              <MenuItem key={subject.subject_id} value={subject.subject_id}>{subject.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={teacherSubjectForm.activity_type}
            label="Type"
            onChange={(e) => setTeacherSubjectForm({ ...teacherSubjectForm, activity_type: e.target.value })}
          >
            <MenuItem value="course">course</MenuItem>
            <MenuItem value="seminar">seminar</MenuItem>
          </Select>
        </FormControl>
        <Button variant="contained" onClick={saveTeacherSubject}>Assign subject</Button>
      </Stack>
      <GenericTable
        data={(teacherSubjects || []).map((x) => ({ ...x, id: x.subject_teacher_id }))}
        columns={[
          { field: "teacher_full_name", headerName: "Teacher" },
          { field: "subject_name", headerName: "Subject" },
          { field: "activity_type", headerName: "Type" }
        ]}
        actions={[
          { icon: <DeleteIcon />, color: "#0d47a1", onClick: (_id, row) => removeTeacherSubject(row.subject_teacher_id) }
        ]}
      />

      <Typography variant="h6" sx={{ mt: 3 }}>Force student groups/series to teacher activity (Scopes)</Typography>
      <Typography variant="body2">
        Assign a group or series to a teacher's subject activity. Students in this group/series will automatically see the activity on their timetable.
      </Typography>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
        <FormControl size="small" sx={{ minWidth: 260 }}>
          <InputLabel>Subject (Teacher)</InputLabel>
          <Select value={scopeForm.subject_teacher_id} label="Subject (Teacher)" onChange={(e) => setScopeForm({ ...scopeForm, subject_teacher_id: e.target.value })}>
            {(meta.subject_teachers || []).map((st) => (
              <MenuItem key={st.subject_teacher_id} value={st.subject_teacher_id}>
                {st.subject_name} ({st.activity_type}) - {st.first_name} {st.last_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Scope kind</InputLabel>
          <Select value={scopeForm.scope_kind} label="Scope kind" onChange={(e) => setScopeForm({ ...scopeForm, scope_kind: e.target.value })}>
            <MenuItem value="group">Group</MenuItem>
            <MenuItem value="series">Series</MenuItem>
          </Select>
        </FormControl>
        {scopeForm.scope_kind === "group" ? (
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Group</InputLabel>
            <Select value={scopeForm.group_id} label="Group" onChange={(e) => setScopeForm({ ...scopeForm, group_id: e.target.value })}>
              {(meta.groups || []).map((group) => (
                <MenuItem key={group.group_id} value={group.group_id}>{group.group_name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <Autocomplete
            freeSolo
            options={[...new Set((meta.groups || []).map((g) => g.series).filter(Boolean))]}
            value={scopeForm.series_letter}
            onChange={(_e, value) => setScopeForm({ ...scopeForm, series_letter: value || "" })}
            onInputChange={(_e, value) => setScopeForm({ ...scopeForm, series_letter: value || "" })}
            renderInput={(params) => <TextField {...params} size="small" label="Series letter" />}
            sx={{ minWidth: 160 }}
          />
        )}
        <Button variant="contained" onClick={saveScope}>Force link</Button>
      </Stack>
      <GenericTable
        data={(scopes || []).map((x) => ({ ...x, id: x.scope_id }))}
        columns={[
          { field: "subject_name", headerName: "Subject" },
          { field: "activity_type", headerName: "Type" },
          { field: "first_name", headerName: "Teacher First Name" },
          { field: "last_name", headerName: "Teacher Last Name" },
          { field: "scope_kind", headerName: "Scope Kind" },
          { field: "group_id", headerName: "Group ID" },
          { field: "series_letter", headerName: "Series" }
        ]}
        actions={[
          { icon: <DeleteIcon />, color: "#0d47a1", onClick: (_id, row) => removeScope(row.scope_id) }
        ]}
      />
    </Box>
  );
};

export default AdminSubjects;
