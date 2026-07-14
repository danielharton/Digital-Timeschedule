import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Typography,
  createFilterOptions
} from "@mui/material";
import TimetableGrid from "../../components/TimetableGrid";
import { showErrorToast, showSuccessToast } from "../../utils/utilFunctions";
import {
  apiAdminCheckDuplicate,
  apiAdminCheckOverlap,
  apiAdminCreateEntry,
  apiAdminDeleteEntry,
  apiAdminReplaceEntry,
  apiGetAdminSchedule,
  apiGetMeta,
  apiCreateBuilding,
  apiCreateRoom,
  apiSetSubjectOnlineLink
} from "../../api/timetable";

const filter = createFilterOptions();

const dayToNumber = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7 };

const AdminSchedulePlanner = () => {
  const [meta, setMeta] = useState({ groups: [], rooms: [], semesters: [], time_slots: [], subject_teachers: [] });
  const [schedule, setSchedule] = useState({ grid: {}, time_slots: [], current_week_type: null });
  const [allScheduleEntries, setAllScheduleEntries] = useState([]);

  
  const [filterGroup, setFilterGroup] = useState(null);
  const [filterSeries, setFilterSeries] = useState(null);
  const [filterTeacher, setFilterTeacher] = useState(null);

  const [cellProgramFilter, setCellProgramFilter] = useState(null);
  const [cellBuildingFilter, setCellBuildingFilter] = useState(null);

  
  const [cellDialogOpen, setCellDialogOpen] = useState(false);
  const [activeCell, setActiveCell] = useState(null);
  const [cellAction, setCellAction] = useState("place");
  const [editingScheduleEntryId, setEditingScheduleEntryId] = useState(null);
  const [lockedWeekType, setLockedWeekType] = useState(null);
  const [overlapError, setOverlapError] = useState(null);
  const [formStarted, setFormStarted] = useState(false);
  const [parityChoiceOpen, setParityChoiceOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [moveData, setMoveData] = useState(null);

  const [selection, setSelection] = useState({
    semester_id: "",
    group_id: "",
    series: "",
    groupOrSeries: "group",
    week_type: "ALL",
    subject_teacher_id: "",
    room_id: "",
    notes: "",
    online_url: ""
  });

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiGetMeta();
        setMeta(data);
        setSelection((prev) => ({
          ...prev,
          semester_id: prev.semester_id || data.semesters?.[0]?.semester_id || "",
          room_id: prev.room_id || data.rooms?.[0]?.room_id || ""
        }));
      } catch (e) {
        showErrorToast(e.message);
      }
    };
    load();
  }, []);

  const allGroups = useMemo(() => meta.groups || [], [meta.groups]);
  const allSeriesLetters = useMemo(
    () => {
      const groups = meta.groups || [];
      return [...new Set(groups.map((g) => g.series).filter(Boolean))].sort();
    },
    [meta.groups]
  );
  const allTeachers = useMemo(() => {
    const map = new Map();
    for (const st of meta.subject_teachers || []) {
      if (!map.has(st.teacher_id)) {
        map.set(st.teacher_id, { teacher_id: st.teacher_id, label: `${st.first_name} ${st.last_name}` });
      }
    }
    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [meta.subject_teachers]);

  const timeSlotByLabel = useMemo(() => {
    const map = {};
    for (const slot of meta.time_slots || []) {
      map[`${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)}`] = slot.time_slot_id;
    }
    return map;
  }, [meta.time_slots]);

  const loadSchedule = useCallback(async () => {
    const params = {};
    if (filterGroup) params.group_id = filterGroup.group_id;
    if (filterSeries) params.series = filterSeries;
    if (filterTeacher) params.teacher_id = filterTeacher.teacher_id;
    if (!params.group_id && !params.series && !params.teacher_id) {
      setSchedule({ grid: {}, time_slots: [], current_week_type: null });
      return;
    }
    try {
      const data = await apiGetAdminSchedule(params);
      setSchedule(data);
    } catch (e) {
      showErrorToast(e.message);
    }
  }, [filterGroup, filterSeries, filterTeacher]);

  const loadAllSchedules = useCallback(async () => {
    try {
      const data = await apiGetAdminSchedule({});
      const entries = [];
      Object.values(data.grid).forEach(dayCols => {
        Object.values(dayCols).forEach(cell => {
          if (cell && cell.activities) entries.push(...cell.activities);
        });
      });
      setAllScheduleEntries(entries);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    loadSchedule();
    loadAllSchedules();
    const interval = setInterval(() => {
      loadSchedule();
      loadAllSchedules();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadSchedule, loadAllSchedules]);

 

  const resetExtras = () => {
    setParityChoiceOpen(false);
    setLockedWeekType(null);
    setOverlapError(null);
    setFormStarted(false);
    setEditingScheduleEntryId(null);
    setMoveDialogOpen(false);
    setMoveData(null);
  };

  const getProgramNameForGroup = useCallback((gid) => {
    const gObj = (meta.groups || []).find(g => Number(g.group_id) === Number(gid));
    if (gObj && gObj.program_id) {
        const prog = (meta.study_programs || []).find(p => p.program_id === gObj.program_id);
        if (prog) return prog.program_name;
    }
    return null;
  }, [meta.groups, meta.study_programs]);

  const getProgramNameForSubjectTeacher = useCallback((stid) => {
    const st = (meta.subject_teachers || []).find(x => x.subject_teacher_id === Number(stid));
    if (st) {
        const subj = (meta.subjects || []).find(s => s.subject_id === st.subject_id);
        if (subj && subj.program_id) {
            const prog = (meta.study_programs || []).find(p => p.program_id === subj.program_id);
            if (prog) return prog.program_name;
        }
    }
    return null;
  }, [meta.subject_teachers, meta.subjects, meta.study_programs]);

  const prefillFromActivity = useCallback((act) => {
    if (!act) return;
    
    let progName = null;
    if (act.group_id) progName = getProgramNameForGroup(act.group_id);
    if (!progName && act.subject_teacher_id) progName = getProgramNameForSubjectTeacher(act.subject_teacher_id);
    setCellProgramFilter(progName);

    setSelection((prev) => ({
      ...prev,
      semester_id: act.semester_id ?? prev.semester_id,
      group_id: act.group_id ?? "",
      series: "",
      groupOrSeries: "group",
      week_type: act.week_type || "ALL",
      subject_teacher_id: act.subject_teacher_id ?? "",
      room_id: act.room_id ?? "",
      notes: act.notes ?? "",
      online_url: act.online_url || ""
    }));
  }, [getProgramNameForGroup, getProgramNameForSubjectTeacher]);

  const openMainCellDialog = ({ slot, day, cell }, mode, options = {}) => {
    const { entryId = null, lockWeek = null, prefillAct = null, started = false } = options;
    setActiveCell({ slot, day, cell });
    setCellAction(mode);
    setLockedWeekType(lockWeek);
    setOverlapError(null);
    setFormStarted(started || !!lockWeek || mode === "replace");
    if (mode === "replace") setEditingScheduleEntryId(entryId != null ? entryId : null);
    else setEditingScheduleEntryId(null);
    if (prefillAct) prefillFromActivity(prefillAct);
    setCellDialogOpen(true);
  };

  const openCellDialog = ({ slot, day, cell }) => {
    resetExtras();
    if (!cell) {
      let preGroupOrSeries = "group";
      let preGroupId = "";
      let preSeries = "";
      if (filterSeries) {
          preGroupOrSeries = "series";
          preSeries = filterSeries;
      } else if (filterGroup) {
          preGroupOrSeries = "group";
          preGroupId = filterGroup.group_id;
      }

      let preSubjectTeacherId = "";
      if (filterTeacher && meta.subject_teachers) {
          const teacherSubjects = meta.subject_teachers.filter(st => st.teacher_id === filterTeacher.teacher_id);
          const unreservedTeacherSubjects = teacherSubjects.filter(st => {
             const acts = allScheduleEntries.filter(a => a.subject_teacher_id === st.subject_teacher_id);
             return acts.length === 0;
          });
          if (unreservedTeacherSubjects.length > 0) {
              preSubjectTeacherId = unreservedTeacherSubjects[0].subject_teacher_id;
          } else if (teacherSubjects.length > 0) {
              preSubjectTeacherId = teacherSubjects[0].subject_teacher_id;
          }
      } else if (filterSeries || filterGroup) {
          const gids = preGroupOrSeries === "series" ? allGroups.filter((g) => g.series === preSeries).map((g) => Number(g.group_id)) : [Number(preGroupId)];
          const stList = meta.subject_teachers || [];
          const unreservedList = stList.filter(st => {
              const acts = allScheduleEntries.filter(a => a.subject_teacher_id === st.subject_teacher_id && gids.includes(a.group_id));
              return acts.length === 0;
          });
          const targetType = preGroupOrSeries === "series" ? "course" : "seminar";
          const matchUnreservedTarget = unreservedList.find(st => st.activity_type === targetType);
          const matchUnreservedAny = unreservedList[0];
          if (matchUnreservedTarget) preSubjectTeacherId = matchUnreservedTarget.subject_teacher_id;
          else if (matchUnreservedAny) preSubjectTeacherId = matchUnreservedAny.subject_teacher_id;
      }

      let preProgramFilter = null;
      if (preGroupId) preProgramFilter = getProgramNameForGroup(preGroupId);
      if (!preProgramFilter && preSubjectTeacherId) preProgramFilter = getProgramNameForSubjectTeacher(preSubjectTeacherId);
      setCellProgramFilter(preProgramFilter);

      setActiveCell({ slot, day, cell: null });
      setCellAction("place");
      setEditingScheduleEntryId(null);
      setLockedWeekType(null);
      setOverlapError(null);
      setFormStarted(false);
      setSelection((prev) => ({ 
        ...prev, 
        week_type: "ALL", 
        notes: "",
        online_url: "",
        groupOrSeries: preGroupOrSeries,
        group_id: preGroupId,
        series: preSeries,
        subject_teacher_id: preSubjectTeacherId || prev.subject_teacher_id
      }));
      setCellDialogOpen(true);
      return;
    }
    const acts = cell.activities || [cell];
    const singleParity = acts.length === 1 && (acts[0].week_type === "ODD" || acts[0].week_type === "EVEN");
    setActiveCell({ slot, day, cell });
    if (singleParity) {
      setParityChoiceOpen(true);
      return;
    }
    const first = acts[0];
    openMainCellDialog({ slot, day, cell }, "replace", { entryId: first.schedule_entry_id, prefillAct: first });
  };

  const handleParityChoiceModify = () => {
    if (!activeCell?.cell) return;
    const act = (activeCell.cell.activities || [activeCell.cell])[0];
    setParityChoiceOpen(false);
    openMainCellDialog(activeCell, "replace", { entryId: act.schedule_entry_id, prefillAct: act });
  };

  const handleParityChoiceAddComplementary = () => {
    if (!activeCell?.cell) return;
    const act = (activeCell.cell.activities || [activeCell.cell])[0];
    const opposite = act.week_type === "ODD" ? "EVEN" : "ODD";
    setParityChoiceOpen(false);
    openMainCellDialog(activeCell, "place", {
      lockWeek: opposite,
      prefillAct: { ...act, week_type: opposite, notes: "" },
      started: true
    });
  };

  const closeCellDialog = () => {
    setCellDialogOpen(false);
    setActiveCell(null);
    resetExtras();
  };

  const closeParityChoice = () => {
    setParityChoiceOpen(false);
    setActiveCell(null);
    resetExtras();
  };

  const markFormStarted = () => setFormStarted(true);

  const placementGroupIds = useCallback(() => {
    if (selection.groupOrSeries === "series") {
      return allGroups.filter((g) => g.series === selection.series).map((g) => Number(g.group_id));
    }
    const g = Number(selection.group_id);
    return Number.isFinite(g) && g > 0 ? [g] : [];
  }, [selection.groupOrSeries, selection.series, selection.group_id, allGroups]);

  const weekTypeLocked = Boolean(lockedWeekType);

  useEffect(() => {
    if (lockedWeekType) setSelection((s) => ({ ...s, week_type: lockedWeekType }));
  }, [lockedWeekType]);

  
  const overlapCheckEnabled =
    cellAction === "replace" || !!lockedWeekType || formStarted || (cellAction === "place" && !activeCell?.cell);

  useEffect(() => {
    if (!cellDialogOpen || !activeCell) {
      setOverlapError(null);
      return undefined;
    }
    const slotId = timeSlotByLabel[activeCell.slot];
    const dayNum = dayToNumber[activeCell.day];
    const gids = placementGroupIds().filter((n) => Number.isFinite(n) && n > 0);
    const ready =
      selection.semester_id && gids.length > 0 && selection.room_id && selection.subject_teacher_id && selection.week_type && slotId && dayNum;
    if (!ready || !overlapCheckEnabled) {
      setOverlapError(null);
      return undefined;
    }
    const handle = setTimeout(async () => {
      try {
        const cellActs = activeCell?.cell ? activeCell.cell.activities || [activeCell.cell] : [];
        const ignore_schedule_entry_ids = cellActs.map((a) => Number(a.schedule_entry_id)).filter((id) => Number.isInteger(id) && id > 0);
        const base = {
          semester_id: Number(selection.semester_id),
          subject_teacher_id: Number(selection.subject_teacher_id),
          room_id: Number(selection.room_id),
          day_of_week: dayNum,
          time_slot_id: slotId,
          week_type: selection.week_type || "ALL",
          ignore_schedule_entry_ids
        };
        const finalGids = selection.groupOrSeries === "series" ? [gids[0]] : gids;
        let finalError = null;
        for (const gid of finalGids) {
          if (!gid) continue;
          const data = await apiAdminCheckOverlap({ ...base, group_id: gid });
          if (data.hasConflict) {
            finalError = data.message;
            break;
          }
        }
        setOverlapError(finalError);
      } catch {
        setOverlapError(null);
      }
    }, 450);
    return () => clearTimeout(handle);
    
  }, [cellDialogOpen, activeCell, selection.semester_id, selection.group_id, selection.groupOrSeries, selection.series, selection.room_id, selection.subject_teacher_id, selection.week_type, overlapCheckEnabled, timeSlotByLabel, placementGroupIds]);

  
  const placeOrReplace = async () => {
    try {
      if (!activeCell) return;
      if (overlapError) {
        showErrorToast(overlapError);
        return;
      }
      const gids = placementGroupIds().filter((n) => Number.isFinite(n) && n > 0);
      if (gids.length === 0) {
        showErrorToast("No valid groups for placement.");
        return;
      }
      if (gids.length > 1 && selection.groupOrSeries !== "series") {
        showErrorToast("Only one group per slot. Pick a single group.");
        return;
      }
      const basePayload = {
        semester_id: Number(selection.semester_id),
        subject_teacher_id: Number(selection.subject_teacher_id),
        room_id: Number(selection.room_id),
        day_of_week: dayToNumber[activeCell.day],
        time_slot_id: timeSlotByLabel[activeCell.slot],
        week_type: selection.week_type || "ALL",
        notes: selection.notes
      };

      const finalGids = selection.groupOrSeries === "series" ? [gids[0]] : gids;

      if (cellAction === "replace") {
        const rid = editingScheduleEntryId;
        if (!rid) {
          showErrorToast("Select an activity to edit");
          return;
        }
        await apiAdminReplaceEntry(rid, { ...basePayload, group_id: finalGids[0] });
        showSuccessToast("Activity replaced");
      } else {
        for (const gid of finalGids) {
          if (!gid) continue;
          const payload = { ...basePayload, group_id: gid };
          const dupCheck = await apiAdminCheckDuplicate({
            semester_id: payload.semester_id,
            subject_teacher_id: payload.subject_teacher_id,
            group_id: payload.group_id,
            ignore_schedule_entry_id: editingScheduleEntryId || undefined
          });
          if (dupCheck.hasDuplicate) {
            setMoveData({ payload, existingId: dupCheck.existing_schedule_entry_id, message: dupCheck.message });
            setMoveDialogOpen(true);
            return;
          }
        }
        for (const gid of finalGids) {
          if (!gid) continue;
          const payload = { ...basePayload, group_id: gid };
          await apiAdminCreateEntry(payload);
        }
        showSuccessToast("Activity placed");
      }

      if (selection.online_url && selection.online_url.trim()) {
        const st = sortedSubjectTeachers.find(x => x.subject_teacher_id === Number(selection.subject_teacher_id));
        if (st) {
            await apiSetSubjectOnlineLink({
                subject_teacher_id: Number(selection.subject_teacher_id),
                activity_type: st.activity_type,
                group_id: selection.groupOrSeries === "group" ? Number(selection.group_id) : null,
                series: selection.groupOrSeries === "series" ? selection.series : null,
                online_url: selection.online_url.trim()
            });
        }
      }

      closeCellDialog();
      await loadSchedule();
      await loadAllSchedules();
    } catch (e) {
      showErrorToast(e.message);
    }
  };

  const handleMoveConfirm = async () => {
    try {
      if (!moveData) return;
      await apiAdminReplaceEntry(moveData.existingId, moveData.payload);
      showSuccessToast("Activity moved");
      setMoveDialogOpen(false);
      setMoveData(null);
      closeCellDialog();
      await loadSchedule();
      await loadAllSchedules();
    } catch (e) {
      showErrorToast(e.message);
    }
  };

  const deleteActivity = async () => {
    try {
      const acts = activeCell?.cell ? activeCell.cell.activities || [activeCell.cell] : [];
      const id = editingScheduleEntryId || acts[0]?.schedule_entry_id;
      if (!id) return;
      await apiAdminDeleteEntry(id);
      showSuccessToast("Activity deleted");
      closeCellDialog();
      await loadSchedule();
      await loadAllSchedules();
    } catch (e) {
      showErrorToast(e.message);
    }
  };

  const cellDialogActs = cellDialogOpen && activeCell?.cell ? activeCell.cell.activities || [activeCell.cell] : [];
  const weekSummary = (wt) => {
    if (wt === "ODD") return "Odd week";
    if (wt === "EVEN") return "Even week";
    return "Every week";
  };

  const overlappingEntries = useMemo(() => {
    if (!cellDialogOpen || !activeCell) return [];
    const slotId = timeSlotByLabel[activeCell.slot];
    const dayNum = dayToNumber[activeCell.day];
    const weekType = selection.week_type || "ALL";
    return allScheduleEntries.filter(act => {
      return act.time_slot_id === slotId &&
             act.day_of_week === dayNum &&
             (act.week_type === "ALL" || weekType === "ALL" || act.week_type === weekType) &&
             act.schedule_entry_id !== editingScheduleEntryId;
    });
  }, [allScheduleEntries, cellDialogOpen, activeCell, selection.week_type, timeSlotByLabel, editingScheduleEntryId]);

  const unavailableRoomIds = useMemo(() => new Set(overlappingEntries.map(e => e.room_id)), [overlappingEntries]);
  const unavailableGroupIds = useMemo(() => new Set(overlappingEntries.map(e => e.group_id)), [overlappingEntries]);
  const unavailableTeacherIds = useMemo(() => new Set(overlappingEntries.map(e => e.teacher_id)), [overlappingEntries]);

  const quotaExceededGroupIds = useMemo(() => {
    if (!selection.subject_teacher_id) return new Set();
    const stId = Number(selection.subject_teacher_id);
    const set = new Set();
    for (const act of allScheduleEntries) {
      if (act.subject_teacher_id === stId && act.schedule_entry_id !== editingScheduleEntryId) {
        set.add(act.group_id);
      }
    }
    return set;
  }, [allScheduleEntries, selection.subject_teacher_id, editingScheduleEntryId]);

  const sortedRooms = useMemo(() => {
    return [...(meta.rooms || [])]
      .filter(r => !cellBuildingFilter || r.building_code === cellBuildingFilter)
      .sort((a, b) => {
        const aUnav = unavailableRoomIds.has(a.room_id) ? 1 : 0;
        const bUnav = unavailableRoomIds.has(b.room_id) ? 1 : 0;
        return aUnav - bUnav || a.room_code.localeCompare(b.room_code);
      });
  }, [meta.rooms, unavailableRoomIds, cellBuildingFilter]);

  const reservedSubjectTeacherIds = useMemo(() => {
    const gids = selection.groupOrSeries === "series" ? allGroups.filter((g) => g.series === selection.series).map((g) => Number(g.group_id)) : [Number(selection.group_id)];
    const reserved = new Set();
    for (const act of allScheduleEntries) {
       if (gids.includes(act.group_id)) {
          reserved.add(act.subject_teacher_id);
       }
    }
    return reserved;
  }, [allScheduleEntries, selection.groupOrSeries, selection.series, selection.group_id, allGroups]);

  const sortedSubjectTeachers = useMemo(() => {
    return [...(meta.subject_teachers || [])]
      .filter(st => {
        if (!cellProgramFilter) return true;
        const subj = (meta.subjects || []).find(s => s.subject_id === st.subject_id);
        if (!subj || !subj.program_id) return false;
        const sp = (meta.study_programs || []).find(p => p.program_id === subj.program_id);
        return sp && sp.program_name === cellProgramFilter;
      })
      .sort((a, b) => {
        const aUnav = unavailableTeacherIds.has(a.teacher_id) ? 1 : 0;
        const bUnav = unavailableTeacherIds.has(b.teacher_id) ? 1 : 0;
        if (aUnav !== bUnav) return aUnav - bUnav;
        const aRes = reservedSubjectTeacherIds.has(a.subject_teacher_id) ? 1 : 0;
        const bRes = reservedSubjectTeacherIds.has(b.subject_teacher_id) ? 1 : 0;
        if (aRes !== bRes) return aRes - bRes;
        return a.first_name.localeCompare(b.first_name);
      });
  }, [meta.subject_teachers, meta.subjects, meta.study_programs, unavailableTeacherIds, reservedSubjectTeacherIds, cellProgramFilter]);

  const sortedGroups = useMemo(() => {
    return [...allGroups].filter(a => !unavailableGroupIds.has(a.group_id) && !quotaExceededGroupIds.has(a.group_id)).sort((a, b) => {
      return a.group_name.localeCompare(b.group_name);
    });
  }, [allGroups, unavailableGroupIds, quotaExceededGroupIds]);

  const sortedSeries = useMemo(() => {
    return [...allSeriesLetters].filter(a => !allGroups.filter(g => g.series === a).some(g => unavailableGroupIds.has(g.group_id) || quotaExceededGroupIds.has(g.group_id))).sort((a, b) => {
      return a.localeCompare(b);
    });
  }, [allSeriesLetters, allGroups, unavailableGroupIds, quotaExceededGroupIds]);

  return (
    <Box>
      <Typography variant="h5">Schedule Planner</Typography>
      <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
        Search by group, series, or teacher to view and manage the timetable. Click any cell to place, replace or delete activities.
      </Typography>

      {}
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
        <Autocomplete
          sx={{ minWidth: 200 }}
          options={allGroups}
          getOptionLabel={(o) => `${o.group_name} (Y${o.study_year}${o.series ? " " + o.series : ""})`}
          value={filterGroup}
          onChange={(_e, v) => setFilterGroup(v)}
          renderInput={(params) => <TextField {...params} label="Group" size="small" />}
        />
        <Autocomplete
          sx={{ minWidth: 120 }}
          options={allSeriesLetters}
          value={filterSeries}
          onChange={(_e, v) => setFilterSeries(v)}
          renderInput={(params) => <TextField {...params} label="Series" size="small" />}
        />
        <Autocomplete
          sx={{ minWidth: 220 }}
          options={allTeachers}
          getOptionLabel={(o) => o.label}
          value={filterTeacher}
          onChange={(_e, v) => setFilterTeacher(v)}
          renderInput={(params) => <TextField {...params} label="Teacher" size="small" />}
        />
      </Stack>

      {!filterGroup && !filterSeries && !filterTeacher && (
        <Alert severity="info">Select at least one filter (group, series, or teacher) to view the schedule.</Alert>
      )}

      {(filterGroup || filterSeries || filterTeacher) && (
        <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
          {filterGroup && (
            <Chip
              label={`Group: ${filterGroup.group_name}`}
              onClick={() => setFilterGroup(null)}
              onDelete={() => setFilterGroup(null)}
            />
          )}
          {filterSeries && (
            <Chip
              label={`Series: ${filterSeries}`}
              onClick={() => setFilterSeries(null)}
              onDelete={() => setFilterSeries(null)}
            />
          )}
          {filterTeacher && (
            <Chip
              label={`Teacher: ${filterTeacher.label}`}
              onClick={() => setFilterTeacher(null)}
              onDelete={() => setFilterTeacher(null)}
            />
          )}
        </Stack>
      )}

      <TimetableGrid
        grid={schedule.grid}
        timeSlots={schedule.time_slots || []}
        clickable={true}
        onCellClick={openCellDialog}
        currentWeekType={schedule.current_week_type}
      />

      {}
      <Dialog open={parityChoiceOpen} onClose={closeParityChoice} maxWidth="xs" fullWidth>
        <DialogTitle>This cell ({activeCell?.day} {activeCell?.slot})</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            This slot has an odd- or even-week activity. Modify it or add another activity locked to the opposite week parity.
          </Typography>
          <Stack spacing={1.5}>
            <Button variant="contained" fullWidth onClick={handleParityChoiceModify}>Modify existing activity</Button>
            <Button variant="outlined" fullWidth onClick={handleParityChoiceAddComplementary}>Add another activity (opposite week)</Button>
            <Button fullWidth onClick={closeParityChoice}>Cancel</Button>
          </Stack>
        </DialogContent>
      </Dialog>

      {}
      <Dialog open={moveDialogOpen} onClose={() => setMoveDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Duplicate activity detected</DialogTitle>
        <DialogContent>
          <Typography variant="body2">{moveData?.message}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMoveDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleMoveConfirm}>Move activity</Button>
        </DialogActions>
      </Dialog>

      {}
      <Dialog open={cellDialogOpen} onClose={closeCellDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Cell options ({activeCell?.day} {activeCell?.slot})</DialogTitle>
        <DialogContent>
          {activeCell?.cell ? (
            <Stack spacing={1} sx={{ mb: 2 }}>
              {cellDialogActs.map((a) => (
                <Typography key={a.schedule_entry_id} variant="body2">
                  {a.subject} ({a.activity_type}) — Room: {a.room} — {a.activity_type === "course" ? `Series: ${a.series || a.group_name}` : `Group: ${a.group_name}`}
                  {a.week_type !== "ALL" ? ` — ${weekSummary(a.week_type)}` : ""}
                </Typography>
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" sx={{ mb: 2 }}>This slot is empty. You can place activity.</Typography>
          )}

          {activeCell?.cell && (
            <Button variant="outlined" color="error" onClick={deleteActivity} sx={{ mb: 2 }}>Delete activity</Button>
          )}

          {overlapError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setOverlapError(null)}>
              {overlapError}
            </Alert>
          )}

          <Typography variant="body2" sx={{ mb: 1 }}>
            {cellAction === "replace" ? "Replace activity options" : "Place activity options"}
          </Typography>
          <Stack spacing={2}>
            {cellAction === "replace" && cellDialogActs.length > 1 && (
              <FormControl fullWidth size="small">
                <InputLabel>Activity to edit</InputLabel>
                <Select
                  label="Activity to edit"
                  value={editingScheduleEntryId || ""}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setEditingScheduleEntryId(id);
                    const act = cellDialogActs.find((x) => x.schedule_entry_id === id);
                    if (act) prefillFromActivity(act);
                    markFormStarted();
                  }}
                >
                  {cellDialogActs.map((a) => (
                    <MenuItem key={a.schedule_entry_id} value={a.schedule_entry_id}>
                      {a.subject} ({a.activity_type}) — {weekSummary(a.week_type)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
            <Autocomplete
              options={[...new Set((meta.study_programs || []).map((sp) => sp.program_name).filter(Boolean))]}
              value={cellProgramFilter}
              onChange={(_e, v) => setCellProgramFilter(v)}
              renderInput={(params) => <TextField {...params} label="Filter by Study Program" size="small" />}
            />
            <Autocomplete
              options={sortedSubjectTeachers}
              getOptionLabel={(o) => {
                const base = `${o.subject_name} (${o.activity_type}) — ${o.first_name} ${o.last_name}`;
                if (unavailableTeacherIds.has(o.teacher_id)) return `${base} (Unavailable)`;
                if (reservedSubjectTeacherIds.has(o.subject_teacher_id)) return `${base} (Reserved)`;
                return base;
              }}
              value={sortedSubjectTeachers.find((x) => x.subject_teacher_id === Number(selection.subject_teacher_id)) || null}
              onChange={(_e, v) => {
                markFormStarted();
                let nextGroupOrSeries = selection.groupOrSeries;
                let nextSeries = selection.series;
                let nextGroupId = selection.group_id;

                if (v?.activity_type === "course" && nextGroupOrSeries === "group") {
                   const gid = Number(nextGroupId);
                   const gObj = allGroups.find(g => Number(g.group_id) === gid);
                   if (gObj && gObj.series) {
                      nextGroupOrSeries = "series";
                      nextSeries = gObj.series;
                   }
                }
                
                setSelection({ 
                  ...selection, 
                  subject_teacher_id: v?.subject_teacher_id || "",
                  groupOrSeries: nextGroupOrSeries,
                  series: nextSeries,
                  group_id: nextGroupId
                });
              }}
              renderInput={(params) => <TextField {...params} label="Subject (teacher)" size="small" />}
            />
            <RadioGroup
              row
              value={selection.groupOrSeries}
              onChange={(e) => { markFormStarted(); setSelection({ ...selection, groupOrSeries: e.target.value }); }}
            >
              <FormControlLabel value="group" control={<Radio />} label="Group" />
              <FormControlLabel value="series" control={<Radio />} label="Series" />
            </RadioGroup>
            {selection.groupOrSeries === "group" ? (
              <Autocomplete
                options={sortedGroups}
                getOptionLabel={(o) => {
                  const base = `${o.group_name} (Y${o.study_year}${o.series ? " " + o.series : ""})`;
                  return unavailableGroupIds.has(o.group_id) ? `${base} (Unavailable)` : base;
                }}
                value={sortedGroups.find((x) => x.group_id === Number(selection.group_id)) || null}
                onChange={(_e, v) => { markFormStarted(); setSelection({ ...selection, group_id: v?.group_id || "" }); }}
                renderInput={(params) => <TextField {...params} label="Group" size="small" />}
              />
            ) : (
              <>
                <Autocomplete
                  options={sortedSeries}
                  getOptionLabel={(o) => {
                    const isUnav = allGroups.filter(g => g.series === o).some(g => unavailableGroupIds.has(g.group_id));
                    return isUnav ? `${o} (Unavailable)` : o;
                  }}
                  value={selection.series || null}
                  onChange={(_e, v) => {
                    markFormStarted();
                    const firstGroupInSeries = allGroups.find((g) => g.series === v);
                    setSelection({ ...selection, series: v || "", group_id: firstGroupInSeries?.group_id || "" });
                  }}
                  renderInput={(params) => <TextField {...params} label="Series" size="small" />}
                />
                <Typography variant="body2">
                  Groups in selected series: {allGroups.filter((g) => g.series === selection.series).map((g) => g.group_name).join(", ") || "-"}
                </Typography>
              </>
            )}
            <Autocomplete
              freeSolo
              selectOnFocus
              clearOnBlur
              handleHomeEndKeys
              options={[...new Set((meta.buildings || []).map((b) => b.building_code).filter(Boolean))]}
              value={cellBuildingFilter}
              onChange={async (_e, v) => {
                if (typeof v === "string" && v.trim() && !meta.buildings?.some(b => b.building_code === v)) {
                   try {
                     await apiCreateBuilding({ building_code: v.trim(), building_name: v.trim() });
                     showSuccessToast(`Building ${v} created`);
                     const newMeta = await apiGetMeta();
                     setMeta(newMeta);
                     setCellBuildingFilter(v.trim());
                   } catch(e) { showErrorToast(e.message); }
                } else {
                   setCellBuildingFilter(v || null);
                }
              }}
              filterOptions={(options, params) => {
                const filtered = filter(options, params);
                if (params.inputValue !== "") {
                  filtered.push(`Add "${params.inputValue}"`);
                }
                return filtered;
              }}
              renderInput={(params) => <TextField {...params} label="Filter/Create Building" size="small" />}
            />
            <Autocomplete
              freeSolo
              selectOnFocus
              clearOnBlur
              handleHomeEndKeys
              options={sortedRooms}
              getOptionLabel={(o) => {
                 if (typeof o === "string") return o;
                 if (o.inputValue) return o.inputValue;
                 return unavailableRoomIds.has(o.room_id) ? `${o.room_code} (Unavailable)` : o.room_code;
              }}
              value={sortedRooms.find((x) => x.room_id === Number(selection.room_id)) || null}
              onChange={async (_e, v) => { 
                markFormStarted(); 
                if (typeof v === "string") {
                  if (!cellBuildingFilter) {
                     showErrorToast("Please select/create a Building first to create a Room");
                     return;
                  }
                  const cleanVal = v.replace('Add "', '').replace('"', '');
                  try {
                     const bld = meta.buildings?.find(b => b.building_code === cellBuildingFilter);
                     if (!bld) throw new Error("Building not found");
                     const created = await apiCreateRoom({ room_code: cleanVal, capacity: 30, building_id: bld.building_id });
                     showSuccessToast(`Room ${cleanVal} created`);
                     const newMeta = await apiGetMeta();
                     setMeta(newMeta);
                     setSelection({ ...selection, room_id: created.id || "" });
                  } catch(e) { showErrorToast(e.message); }
                } else if (v && v.inputValue) {
                  if (!cellBuildingFilter) {
                     showErrorToast("Please select/create a Building first to create a Room");
                     return;
                  }
                  try {
                     const bld = meta.buildings?.find(b => b.building_code === cellBuildingFilter);
                     if (!bld) throw new Error("Building not found");
                     const created = await apiCreateRoom({ room_code: v.inputValue, capacity: 30, building_id: bld.building_id });
                     showSuccessToast(`Room ${v.inputValue} created`);
                     const newMeta = await apiGetMeta();
                     setMeta(newMeta);
                     setSelection({ ...selection, room_id: created.id || "" });
                  } catch(e) { showErrorToast(e.message); }
                } else {
                  setSelection({ ...selection, room_id: v?.room_id || "" }); 
                }
              }}
              filterOptions={(options, params) => {
                const filtered = filter(options, params);
                if (params.inputValue !== "") {
                  filtered.push({
                    inputValue: params.inputValue,
                    room_code: `Add "${params.inputValue}"`,
                  });
                }
                return filtered;
              }}
              renderInput={(params) => <TextField {...params} label="Room" size="small" />}
            />
            <RadioGroup
              row
              value={selection.week_type}
              onChange={(e) => { if (weekTypeLocked) return; markFormStarted(); setSelection({ ...selection, week_type: e.target.value }); }}
            >
              <FormControlLabel value="ALL" control={<Radio disabled={weekTypeLocked && lockedWeekType !== "ALL"} />} label="Every week" />
              <FormControlLabel value="ODD" control={<Radio disabled={weekTypeLocked && lockedWeekType !== "ODD"} />} label="Odd week" />
              <FormControlLabel value="EVEN" control={<Radio disabled={weekTypeLocked && lockedWeekType !== "EVEN"} />} label="Even week" />
            </RadioGroup>
            <TextField
              size="small"
              label="Notes"
              value={selection.notes}
              onChange={(e) => { markFormStarted(); setSelection({ ...selection, notes: e.target.value }); }}
            />
            <TextField
              size="small"
              label="online.ase.ro link"
              value={selection.online_url || ""}
              onChange={(e) => { markFormStarted(); setSelection({ ...selection, online_url: e.target.value }); }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeCellDialog}>Close</Button>
          <Button variant="contained" disabled={Boolean(overlapError)} onClick={placeOrReplace}>
            {cellAction === "replace" ? "Replace" : "Place"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminSchedulePlanner;
