import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  createFilterOptions
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import LinkIcon from "@mui/icons-material/Link";
import EditIcon from "@mui/icons-material/Edit";
import { showErrorToast, showSuccessToast } from "../../utils/utilFunctions";
import {
  apiAssignAccounts,
  apiBulkDeleteUsers,
  apiCreateUser,
  apiDeleteAssociation,
  apiDeleteUser,
  apiUpdateUser,
  apiGetMeta,
  apiGetAssociations,
  apiGetSubjects,
  apiGetTeacherSubjects,
  apiGetTeachers,
  apiGetUsers,
  apiGetScopes
} from "../../api/timetable";
import GenericTable from "../../components/GenericTable";

const filter = createFilterOptions();
const emptyForm = { first_name: "", last_name: "", cnp: "", email: "", password: "", phone: "", role_name: "student", group_id: "", series: "" };
const emptyBulk = { target_role: "student", group_name: "", series: "", subject: "" };

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [programFilter, setProgramFilter] = useState(null);
  const [facultyFilter, setFacultyFilter] = useState(null);
  const [universityFilter, setUniversityFilter] = useState(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignFrom, setAssignFrom] = useState(null);
  const [assignTo, setAssignTo] = useState(null);
  const [existingAssociations, setExistingAssociations] = useState([]);
  const [bulkFilters, setBulkFilters] = useState(emptyBulk);
  const [meta, setMeta] = useState({ groups: [], subject_teachers: [] });
  const [, setTeachers] = useState([]);
  const [, setTeacherSubjects] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ user_id: "", first_name: "", last_name: "", cnp: "", email: "", password: "", phone: "", role_name: "student", group_id: "", series: "" });


  const [studentGroupForm, setStudentGroupForm] = useState({ series: "", group_id: "" });
  const [, setScopes] = useState([]);

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
    } catch (error) {
      if (!silent) showErrorToast(error.message);
      return null;
    }
  }, []);

  const loadData = useCallback(async (query = "", silent = false) => {
    try {
      const usersData = await apiGetUsers(query);
      setUsers(usersData.map((row) => ({ ...row, id: row.user_id })));
    } catch (error) {
      if (!silent) showErrorToast(error.message);
    }
  }, []);

  const refreshAssociations = useCallback(async (userId, silent = false) => {
    try {
      const associations = await apiGetAssociations(userId);
      setExistingAssociations(associations);
    } catch (error) {
      if (!silent) showErrorToast(error.message);
      if (!silent) setExistingAssociations([]);
    }
  }, []);

  useEffect(() => {
    loadData();
    refreshAdminReferences().catch(() => { });
  }, [loadData, refreshAdminReferences]);

  useEffect(() => {
    const timeout = setTimeout(() => loadData(searchText), 250);
    return () => clearTimeout(timeout);
  }, [searchText, loadData]);

  useEffect(() => {
    if (!assignFrom) return;
    const latest = users.find((u) => Number(u.user_id) === Number(assignFrom.user_id));
    if (latest) setAssignFrom((prev) => ({ ...prev, ...latest }));
  }, [users, assignFrom]);

  useEffect(() => {
    const interval = setInterval(async () => {
      await Promise.all([loadData(searchText, true), refreshAdminReferences(true)]);
      if (assignDialogOpen && assignFrom?.user_id) {
        await refreshAssociations(assignFrom.user_id, true);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [searchText, loadData, refreshAdminReferences, assignDialogOpen, assignFrom, refreshAssociations]);

  useEffect(() => {
    const syncOnFocus = async () => {
      await Promise.all([loadData(searchText, true), refreshAdminReferences(true)]);
      if (assignDialogOpen && assignFrom?.user_id) {
        await refreshAssociations(assignFrom.user_id, true);
      }
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
  }, [searchText, assignDialogOpen, assignFrom, loadData, refreshAdminReferences, refreshAssociations]);

  useEffect(() => {
    if (!assignDialogOpen || existingAssociations.length === 0) return;
    setExistingAssociations((prev) =>
      prev.map((association) => {
        const latest = users.find((u) => Number(u.user_id) === Number(association.user_id));
        if (!latest) return association;
        return {
          ...association,
          first_name: latest.first_name,
          last_name: latest.last_name,
          role_name: latest.role_name
        };
      })
    );
  }, [users, assignDialogOpen, existingAssociations.length]);

  const renderNullableCell = (field) => ({ row, value }) => {
    if (row.role_name === "admin" && ["group_name", "series", "subjects", "assigned_to"].includes(field)) {
      return <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>N/A</Typography>;
    }
    if (row.role_name === "teacher" && ["group_name", "series"].includes(field)) {
      return <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>N/A</Typography>;
    }
    if (row.role_name === "student" && ["subjects"].includes(field)) {
      return <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>N/A</Typography>;
    }
    if (!value || value.length === 0) {
      return <Typography variant="body2" color="error" sx={{ fontStyle: 'italic' }}>Unset</Typography>;
    }
    if (field === "assigned_to" && typeof value === "string" && value.includes("\\n")) {
      return (
        <Box>
          {value.split("\\n").map((line, i) => (
            <Typography key={i} variant="body2">{line}</Typography>
          ))}
        </Box>
      );
    }
    return value;
  };

  const columns = useMemo(
    () => {
      let baseColumns = [
        { field: "user_id", headerName: "ID" },
        { field: "first_name", headerName: "First name" },
        { field: "last_name", headerName: "Last name" },
        { field: "email_address", headerName: "Email" },
        { field: "cnp", headerName: "CNP" },
        { field: "role_name", headerName: "Role" },
        { field: "group_name", headerName: "Group", renderCell: renderNullableCell("group_name") },
        { field: "series", headerName: "Series", renderCell: renderNullableCell("series") },
        { field: "subjects", headerName: "Subjects", renderCell: renderNullableCell("subjects") },
        { field: "assigned_to", headerName: "AssignedTo", renderCell: renderNullableCell("assigned_to") }
      ];

      if (roleFilter === "student") {
        baseColumns = baseColumns.filter(c => c.field !== "subjects");
      } else if (roleFilter === "teacher") {
        baseColumns = baseColumns.filter(c => !["group_name", "series"].includes(c.field));
      } else if (roleFilter === "admin") {
        baseColumns = baseColumns.filter(c => !["group_name", "series", "subjects", "assigned_to"].includes(c.field));
      }

      return baseColumns;
    },
    [roleFilter]
  );

  const openCreateDialog = () => {
    setForm({ ...emptyForm });
    setCreateDialogOpen(true);
  };

  const closeCreateDialog = () => {
    setCreateDialogOpen(false);
    setForm({ ...emptyForm });
  };

  const handleCreateUser = async () => {
    try {
      await apiCreateUser(form);
      showSuccessToast("User created");
      closeCreateDialog();
      await refreshAdminReferences();
      await loadData(searchText);
    } catch (error) {
      showErrorToast(error.message);
    }
  };

  const openEditDialog = (row) => {
    setEditForm({
      user_id: row.user_id,
      first_name: row.first_name || "",
      last_name: row.last_name || "",
      cnp: row.cnp || "",
      email: row.email_address || "",
      password: "",
      phone: row.phone || "",
      role_name: row.role_name || "student",
      group_id: row.group_id || "",
      series: row.series || ""
    });
    setEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    try {
      await apiUpdateUser(editForm.user_id, {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        cnp: editForm.cnp,
        email: editForm.email,
        password: editForm.password || undefined,
        phone: editForm.phone,
        role_name: editForm.role_name,
        group_id: editForm.group_id || undefined,
        new_group_name: editForm.new_group_name || undefined,
        series: editForm.series || undefined
      });
      showSuccessToast("User updated");
      setEditDialogOpen(false);
      await refreshAdminReferences();
      await loadData(searchText);
    } catch (error) {
      showErrorToast(error.message);
    }
  };

  const handleDeleteUser = async (row) => {
    try {
      await apiDeleteUser(row.user_id);
      showSuccessToast("User deleted");
      await loadData(searchText);
    } catch (error) {
      showErrorToast(error.message);
    }
  };

  const openAssignDialog = async (row) => {
    setAssignFrom(row);
    setAssignTo(null);
    if (row.role_name === "student") {
      setStudentGroupForm({ series: row.series || "", group_id: row.group_id || "" });
    }
    await refreshAssociations(row.user_id);
    setAssignDialogOpen(true);
  };

  const assignOptions = useMemo(() => {
    if (!assignFrom) return [];
    const existingIds = new Set(existingAssociations.map((x) => x.user_id));
    if (assignFrom.role_name === "teacher") return users.filter((u) => u.role_name === "student" && !existingIds.has(u.user_id));
    if (assignFrom.role_name === "student") return users.filter((u) => u.role_name === "teacher" && !existingIds.has(u.user_id));
    return [];
  }, [assignFrom, users, existingAssociations]);

  const saveAssignment = async () => {
    try {
      if (!assignFrom || !assignTo) {
        showErrorToast("Select account to assign");
        return;
      }
      await apiAssignAccounts({ user_id: assignFrom.user_id, assign_to_user_id: assignTo.user_id });
      showSuccessToast("Assignment saved");
      setAssignTo(null);
      await refreshAssociations(assignFrom.user_id);
      await loadData(searchText);
    } catch (error) {
      showErrorToast(error.message);
    }
  };

  const removeAssociation = async (association) => {
    try {
      await apiDeleteAssociation({
        user_id: assignFrom.user_id,
        counterpart_user_id: association.user_id
      });
      showSuccessToast("Association removed");
      await Promise.all([loadData(searchText, true), refreshAssociations(assignFrom.user_id, true)]);
    } catch (error) {
      showErrorToast(error.message);
    }
  };


  const runBulkDelete = async () => {
    try {
      await apiBulkDeleteUsers({ target_role: bulkFilters.target_role, filters: bulkFilters });
      showSuccessToast("Bulk delete executed");
      await loadData(searchText);
    } catch (error) {
      showErrorToast(error.message);
    }
  };

  return (
    <Box sx={{ width: "100%", minWidth: 0, overflow: "visible" }}>
      <Stack spacing={1.5} alignItems="flex-start" sx={{ mb: 2 }}>
        <Typography variant="h5" component="h1">
          Admin - Users Management
        </Typography>
        <Button variant="contained" onClick={openCreateDialog}>
          Create user
        </Button>
      </Stack>

      <Autocomplete
        freeSolo
        options={[
          ...new Set(users.map((u) => u.first_name + " " + u.last_name)),
          ...new Set(users.map((u) => u.email_address)),
          ...new Set(users.map((u) => u.cnp))
        ].filter(Boolean)}
        inputValue={searchText}
        onInputChange={(_e, value) => setSearchText(value)}
        renderInput={(params) => (
          <TextField
            {...params}
            size="small"
            label="Search by name, email or CNP"
            inputProps={{
              ...params.inputProps,
              autoComplete: "new-password",
              "data-1p-ignore": true
            }}
          />
        )}
        sx={{ mb: 2, maxWidth: "100%" }}
      />

      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        {[
          { id: "all", label: "All" },
          { id: "student", label: "Students" },
          { id: "teacher", label: "Teachers" },
          { id: "admin", label: "Admins" }
        ].map(role => (
          <Button
            key={role.id}
            size="small"
            variant="contained"
            color={roleFilter === role.id ? "primary" : "inherit"}
            sx={roleFilter !== role.id ? { backgroundColor: "lightgray", color: "black" } : {}}
            onClick={() => setRoleFilter(role.id)}
          >
            {role.label}
          </Button>
        ))}
      </Stack>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
        <Autocomplete
          sx={{ minWidth: 200 }}
          size="small"
          options={[...new Set((meta.study_programs || []).map((sp) => sp.program_name).filter(Boolean))]}
          value={programFilter}
          onChange={(_e, v) => setProgramFilter(v)}
          renderInput={(params) => <TextField {...params} label="Specialisation" />}
        />
        <Autocomplete
          sx={{ minWidth: 200 }}
          size="small"
          options={[...new Set((meta.study_programs || []).map((sp) => sp.faculty_name).filter(Boolean))]}
          value={facultyFilter}
          onChange={(_e, v) => setFacultyFilter(v)}
          renderInput={(params) => <TextField {...params} label="Faculty" />}
        />
        <Autocomplete
          sx={{ minWidth: 200 }}
          size="small"
          options={[...new Set((meta.study_programs || []).map((sp) => sp.university_name).filter(Boolean))]}
          value={universityFilter}
          onChange={(_e, v) => setUniversityFilter(v)}
          renderInput={(params) => <TextField {...params} label="University" />}
        />
      </Stack>

      <GenericTable
        data={users.filter(u => {
          if (roleFilter !== "all" && u.role_name !== roleFilter) return false;
          if (programFilter || facultyFilter || universityFilter) {
            const userGroup = (meta.groups || []).find(g => g.group_id === u.group_id);
            if (!userGroup) return false;
            const sp = (meta.study_programs || []).find(p => p.program_id === userGroup.program_id);
            if (!sp) return false;
            if (programFilter && sp.program_name !== programFilter) return false;
            if (facultyFilter && sp.faculty_name !== facultyFilter) return false;
            if (universityFilter && sp.university_name !== universityFilter) return false;
          }
          return true;
        })}
        columns={columns}
        actions={[
          { icon: <EditIcon />, color: "#0d47a1", onClick: (_id, row) => openEditDialog(row) },
          { icon: <LinkIcon />, color: "#1565c0", onClick: (_id, row) => openAssignDialog(row), condition: (row) => row.role_name !== "admin" },
          { icon: <DeleteIcon />, color: "#0d47a1", onClick: (_id, row) => handleDeleteUser(row) }
        ]}
      />

      <Typography variant="h6" sx={{ mt: 3 }}>Bulk delete</Typography>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Target role</InputLabel>
          <Select value={bulkFilters.target_role} label="Target role" onChange={(e) => setBulkFilters({ ...bulkFilters, target_role: e.target.value })}>
            <MenuItem value="student">student</MenuItem>
            <MenuItem value="teacher">teacher</MenuItem>
          </Select>
        </FormControl>
        <Autocomplete
          freeSolo
          options={[...new Set((meta.groups || []).map((g) => g.group_name))]}
          value={bulkFilters.group_name}
          onChange={(_e, value) => setBulkFilters({ ...bulkFilters, group_name: value || "" })}
          onInputChange={(_e, value) => setBulkFilters({ ...bulkFilters, group_name: value || "" })}
          renderInput={(params) => <TextField {...params} size="small" label="Group" />}
          sx={{ width: 150 }}
        />
        <Autocomplete
          freeSolo
          options={[...new Set((meta.groups || []).map((g) => g.series).filter(Boolean))]}
          value={bulkFilters.series}
          onChange={(_e, value) => setBulkFilters({ ...bulkFilters, series: value || "" })}
          onInputChange={(_e, value) => setBulkFilters({ ...bulkFilters, series: value || "" })}
          renderInput={(params) => <TextField {...params} size="small" label="Series" />}
          sx={{ width: 150 }}
        />

        <Autocomplete freeSolo options={(subjects || []).map((s) => s.name)} value={bulkFilters.subject} onChange={(_e, value) => setBulkFilters({ ...bulkFilters, subject: value || "" })} onInputChange={(_e, value) => setBulkFilters({ ...bulkFilters, subject: value || "" })} renderInput={(params) => <TextField {...params} size="small" label="Subject (teacher bulk)" />} sx={{ width: 190 }} />
        <Button variant="contained" color="error" onClick={runBulkDelete}>Delete matching</Button>
      </Stack>



      <Dialog open={createDialogOpen} onClose={closeCreateDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create user</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              size="small"
              label="First name"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              fullWidth
              autoFocus
            />
            <TextField
              size="small"
              label="Last name"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              fullWidth
            />
            <TextField
              size="small"
              label="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              fullWidth
            />
            <TextField
              size="small"
              label="CNP"
              value={form.cnp}
              onChange={(e) => setForm({ ...form, cnp: e.target.value })}
              fullWidth
            />
            <TextField
              size="small"
              label="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              fullWidth
            />
            <TextField
              size="small"
              type="password"
              label="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              fullWidth
            />
            <FormControl size="small" fullWidth>
              <InputLabel id="admin-create-role-label">Role</InputLabel>
              <Select
                labelId="admin-create-role-label"
                value={form.role_name}
                label="Role"
                onChange={(e) => setForm({ ...form, role_name: e.target.value })}
              >
                <MenuItem value="student">student</MenuItem>
                <MenuItem value="teacher">teacher</MenuItem>
                <MenuItem value="admin">admin</MenuItem>
              </Select>
            </FormControl>
            {form.role_name === "student" && (
              <Stack direction="row" spacing={1}>
                <Autocomplete
                  freeSolo
                  options={[...new Set((meta.groups || []).map((g) => g.series).filter(Boolean))]}
                  value={form.series}
                  onChange={(_e, newValue) => {
                    if (typeof newValue === "string") {
                      setForm({ ...form, series: newValue, group_id: "" });
                    } else if (newValue && newValue.inputValue) {
                      setForm({ ...form, series: newValue.inputValue, group_id: "" });
                    } else {
                      setForm({ ...form, series: newValue || "", group_id: "" });
                    }
                  }}
                  filterOptions={(options, params) => {
                    const filtered = filter(options, params);
                    const { inputValue } = params;
                    const isExisting = options.some((option) => inputValue === option);
                    if (inputValue !== "" && !isExisting) {
                      filtered.push({ inputValue, isNew: true, title: `Create new series "${inputValue}"` });
                    }
                    return filtered;
                  }}
                  getOptionLabel={(option) => {
                    if (typeof option === "string") return option;
                    if (option.inputValue) return option.inputValue;
                    return option;
                  }}
                  renderOption={(props, option) => (
                    <li {...props}>{option.isNew ? option.title : option}</li>
                  )}
                  onInputChange={(_e, value, reason) => {
                    if (reason === "input") setForm({ ...form, series: value || "", group_id: "" });
                  }}
                  renderInput={(params) => <TextField {...params} size="small" label="Series" />}
                  sx={{ flex: 1 }}
                />
                <Autocomplete
                  freeSolo
                  options={(meta.groups || []).filter(g => !form.series || g.series === form.series)}
                  filterOptions={(options, params) => {
                    const filtered = filter(options, params);
                    const { inputValue } = params;
                    const isExisting = options.some((option) => inputValue === option.group_name);
                    if (inputValue !== "" && !isExisting) {
                      filtered.push({ inputValue, isNew: true, group_name: `Create new group "${inputValue}"` });
                    }
                    return filtered;
                  }}
                  getOptionLabel={(option) => {
                    if (typeof option === "string") return option;
                    if (option.inputValue) return option.inputValue;
                    return option.group_name || "";
                  }}
                  isOptionEqualToValue={(option, value) => option?.group_id === value?.group_id}
                  value={form.new_group_name ? { inputValue: form.new_group_name, group_name: form.new_group_name } : ((meta.groups || []).find(g => g.group_id === form.group_id) || null)}
                  onChange={(_e, value) => {
                    if (typeof value === "string") {
                      setForm({ ...form, group_id: "", new_group_name: value });
                    } else if (value && value.inputValue) {
                      setForm({ ...form, group_id: "", new_group_name: value.inputValue });
                    } else {
                      setForm({ ...form, group_id: value ? value.group_id : "", new_group_name: "" });
                    }
                  }}
                  onInputChange={(_e, value, reason) => {
                    if (reason === "input") setForm({ ...form, group_id: "", new_group_name: value || "" });
                  }}
                  renderOption={(props, option) => (
                    <li {...props}>{option.isNew ? option.group_name : option.group_name}</li>
                  )}
                  renderInput={(params) => <TextField {...params} size="small" label="Group" />}
                  sx={{ flex: 1 }}
                />
              </Stack>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCreateDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateUser}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign account</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {assignFrom ? `Assign ${assignFrom.first_name} ${assignFrom.last_name} (${assignFrom.role_name})` : ""}
          </Typography>
          <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>Assign Individual Account</Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Autocomplete
              options={assignOptions}
              getOptionLabel={(option) => `${option.first_name} ${option.last_name} (${option.role_name})`}
              value={assignTo}
              onChange={(_e, value) => setAssignTo(value)}
              renderInput={(params) => <TextField {...params} label="Choose counterpart account" size="small" />}
              sx={{ flex: 1 }}
            />
            <Button variant="contained" onClick={saveAssignment}>Assign</Button>
          </Stack>
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Current associations</Typography>
          {existingAssociations.length === 0 ? (
            <Typography variant="body2">No associations.</Typography>
          ) : assignFrom?.role_name === "teacher" ? (
            (() => {
              const bySeries = {};
              existingAssociations.forEach(assoc => {
                const series = assoc.series || "No Series";
                const group = assoc.group_name || "No Group";
                if (!bySeries[series]) bySeries[series] = {};
                if (!bySeries[series][group]) bySeries[series][group] = [];
                bySeries[series][group].push(assoc);
              });
              return Object.keys(bySeries).sort().map(series => (
                <Box key={`series-${series}`} sx={{ mb: 2, pl: 1, borderLeft: '2px solid #ccc' }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>Series {series}</Typography>
                  {Object.keys(bySeries[series]).sort().map(group => (
                    <Box key={`group-${group}`} sx={{ mb: 1.5, pl: 2, borderLeft: '2px solid #eee' }}>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>Group {group}</Typography>
                      {bySeries[series][group].map(association => (
                        <Stack key={`assoc-${association.user_id}`} direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5, pl: 2 }}>
                          <Typography variant="body2">
                            {association.first_name} {association.last_name}
                          </Typography>
                          <Button size="small" color="error" onClick={() => removeAssociation(association)}>Delete</Button>
                        </Stack>
                      ))}
                    </Box>
                  ))}
                </Box>
              ));
            })()
          ) : (
            existingAssociations.map((association) => (
              <Stack key={`assoc-${association.user_id}`} direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="body2">
                  {association.first_name} {association.last_name} ({association.role_name})
                </Typography>
                <Button size="small" color="error" onClick={() => removeAssociation(association)}>Delete association</Button>
              </Stack>
            ))
          )}

          {assignFrom?.role_name === "student" && (
            <>
              <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>Manage Student Group & Series</Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Autocomplete
                  freeSolo
                  options={[...new Set((meta.groups || []).map((g) => g.series).filter(Boolean))]}
                  value={studentGroupForm.series}
                  onChange={(_e, value) => setStudentGroupForm({ ...studentGroupForm, series: value || "", group_id: "" })}
                  onInputChange={(_e, value) => setStudentGroupForm({ ...studentGroupForm, series: value || "" })}
                  renderInput={(params) => <TextField {...params} size="small" label="Series" />}
                  sx={{ flex: 1 }}
                />
                <Autocomplete
                  freeSolo
                  options={(meta.groups || []).filter(g => !studentGroupForm.series || g.series === studentGroupForm.series)}
                  filterOptions={(options, params) => {
                    const filtered = filter(options, params);
                    const { inputValue } = params;
                    const isExisting = options.some((option) => inputValue === option.group_name);
                    if (inputValue !== "" && !isExisting) {
                      filtered.push({ inputValue, isNew: true, group_name: `Create new group "${inputValue}"` });
                    }
                    return filtered;
                  }}
                  getOptionLabel={(option) => {
                    if (typeof option === "string") return option;
                    if (option.inputValue) return option.inputValue;
                    return option.group_name || "";
                  }}
                  isOptionEqualToValue={(option, value) => option?.group_id === value?.group_id}
                  value={studentGroupForm.new_group_name ? { inputValue: studentGroupForm.new_group_name, group_name: studentGroupForm.new_group_name } : ((meta.groups || []).find(g => g.group_id === studentGroupForm.group_id) || null)}
                  onChange={(_e, value) => {
                    if (typeof value === "string") {
                      setStudentGroupForm({ ...studentGroupForm, group_id: "", new_group_name: value });
                    } else if (value && value.inputValue) {
                      setStudentGroupForm({ ...studentGroupForm, group_id: "", new_group_name: value.inputValue });
                    } else {
                      setStudentGroupForm({ ...studentGroupForm, group_id: value ? value.group_id : "", new_group_name: "" });
                    }
                  }}
                  onInputChange={(_e, value, reason) => {
                    if (reason === "input") setStudentGroupForm({ ...studentGroupForm, group_id: "", new_group_name: value || "" });
                  }}
                  renderOption={(props, option) => (
                    <li {...props}>{option.isNew ? option.group_name : option.group_name}</li>
                  )}
                  renderInput={(params) => <TextField {...params} size="small" label="Group" />}
                  sx={{ flex: 1 }}
                />
                <Button variant="contained" onClick={async () => {
                  try {
                    if (!studentGroupForm.series || (!studentGroupForm.group_id && !studentGroupForm.new_group_name)) {
                      showErrorToast("Both Series and Group are required");
                      return;
                    }
                    await apiUpdateUser(assignFrom.user_id, {
                      first_name: assignFrom.first_name,
                      last_name: assignFrom.last_name,
                      cnp: assignFrom.cnp,
                      email: assignFrom.email_address,
                      phone: assignFrom.phone || "",
                      role_name: assignFrom.role_name,
                      group_id: studentGroupForm.group_id,
                      new_group_name: studentGroupForm.new_group_name,
                      series: studentGroupForm.series
                    });
                    showSuccessToast("Student group and series saved");
                    await refreshAdminReferences();
                    await loadData(searchText);
                  } catch (e) {
                    showErrorToast(e.message);
                  }
                }}>Save</Button>
              </Stack>
            </>
          )}

        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit account</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField size="small" label="First name" value={editForm.first_name} onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })} />
            <TextField size="small" label="Last name" value={editForm.last_name} onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })} />
            <TextField size="small" label="Email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            <TextField size="small" label="CNP" value={editForm.cnp} onChange={(e) => setEditForm({ ...editForm, cnp: e.target.value })} />
            <TextField size="small" label="Phone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            <TextField size="small" type="password" label="Password (leave empty to keep current)" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} />
            <FormControl size="small">
              <InputLabel>Role</InputLabel>
              <Select value={editForm.role_name} label="Role" onChange={(e) => setEditForm({ ...editForm, role_name: e.target.value })}>
                <MenuItem value="student">student</MenuItem>
                <MenuItem value="teacher">teacher</MenuItem>
                <MenuItem value="admin">admin</MenuItem>
              </Select>
            </FormControl>
            {editForm.role_name === "student" && (
              <Stack direction="row" spacing={1}>
                <Autocomplete
                  freeSolo
                  options={[...new Set((meta.groups || []).map((g) => g.series).filter(Boolean))]}
                  value={editForm.series}
                  onChange={(_e, newValue) => {
                    if (typeof newValue === "string") {
                      setEditForm({ ...editForm, series: newValue, group_id: "" });
                    } else if (newValue && newValue.inputValue) {
                      setEditForm({ ...editForm, series: newValue.inputValue, group_id: "" });
                    } else {
                      setEditForm({ ...editForm, series: newValue || "", group_id: "" });
                    }
                  }}
                  filterOptions={(options, params) => {
                    const filtered = filter(options, params);
                    const { inputValue } = params;
                    const isExisting = options.some((option) => inputValue === option);
                    if (inputValue !== "" && !isExisting) {
                      filtered.push({ inputValue, isNew: true, title: `Create new series "${inputValue}"` });
                    }
                    return filtered;
                  }}
                  getOptionLabel={(option) => {
                    if (typeof option === "string") return option;
                    if (option.inputValue) return option.inputValue;
                    return option;
                  }}
                  renderOption={(props, option) => (
                    <li {...props}>{option.isNew ? option.title : option}</li>
                  )}
                  onInputChange={(_e, value, reason) => {
                    if (reason === "input") setEditForm({ ...editForm, series: value || "", group_id: "" });
                  }}
                  renderInput={(params) => <TextField {...params} size="small" label="Series" />}
                  sx={{ flex: 1 }}
                />
                <Autocomplete
                  freeSolo
                  options={(meta.groups || []).filter(g => !editForm.series || g.series === editForm.series)}
                  filterOptions={(options, params) => {
                    const filtered = filter(options, params);
                    const { inputValue } = params;
                    const isExisting = options.some((option) => inputValue === option.group_name);
                    if (inputValue !== "" && !isExisting) {
                      filtered.push({ inputValue, isNew: true, group_name: `Create new group "${inputValue}"` });
                    }
                    return filtered;
                  }}
                  getOptionLabel={(option) => {
                    if (typeof option === "string") return option;
                    if (option.inputValue) return option.inputValue;
                    return option.group_name || "";
                  }}
                  isOptionEqualToValue={(option, value) => option?.group_id === value?.group_id}
                  value={editForm.new_group_name ? { inputValue: editForm.new_group_name, group_name: editForm.new_group_name } : ((meta.groups || []).find(g => g.group_id === editForm.group_id) || null)}
                  onChange={(_e, value) => {
                    if (typeof value === "string") {
                      setEditForm({ ...editForm, group_id: "", new_group_name: value });
                    } else if (value && value.inputValue) {
                      setEditForm({ ...editForm, group_id: "", new_group_name: value.inputValue });
                    } else {
                      setEditForm({ ...editForm, group_id: value ? value.group_id : "", new_group_name: "" });
                    }
                  }}
                  onInputChange={(_e, value, reason) => {
                    if (reason === "input") setEditForm({ ...editForm, group_id: "", new_group_name: value || "" });
                  }}
                  renderOption={(props, option) => (
                    <li {...props}>{option.isNew ? option.group_name : option.group_name}</li>
                  )}
                  renderInput={(params) => <TextField {...params} size="small" label="Group" />}
                  sx={{ flex: 1 }}
                />
              </Stack>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateUser}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminUsers;
