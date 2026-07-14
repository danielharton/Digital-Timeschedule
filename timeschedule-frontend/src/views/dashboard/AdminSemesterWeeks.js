import { useEffect, useMemo, useState } from "react";
import { Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { apiGetSemesterWeeks, apiSaveSemesterWeeks } from "../../api/timetable";
import { showErrorToast, showSuccessToast } from "../../utils/utilFunctions";

const countUniqueDays = (intervals) => {
  const set = new Set();
  intervals.forEach((interval) => {
    if (!interval.start_date || !interval.end_date) return;
    const start = new Date(interval.start_date);
    const end = new Date(interval.end_date);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return;
    const cursor = new Date(start);
    while (cursor <= end) {
      set.add(cursor.toISOString().slice(0, 10));
      cursor.setDate(cursor.getDate() + 1);
    }
  });
  return set;
};

const AdminSemesterWeeks = () => {
  const navigate = useNavigate();
  const [semesterId, setSemesterId] = useState("");
  const [intervals, setIntervals] = useState([{ start_date: "", end_date: "" }]);
  const [canEdit, setCanEdit] = useState(true);

  const uniqueDays = useMemo(() => countUniqueDays(intervals), [intervals]);
  const totalDays = uniqueDays.size;
  const firstDay = totalDays > 0 ? Array.from(uniqueDays).sort()[0] : null;
  const startsOnMonday = firstDay ? new Date(firstDay).getDay() === 1 : false;

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await apiGetSemesterWeeks();
        setSemesterId(data.semester_id || "");
        setCanEdit(data.canEdit);
        if (data.intervals && data.intervals.length > 0) {
          setIntervals(data.intervals);
        } else {
          setIntervals([
            { start_date: "2026-02-16", end_date: "2026-04-05" },
            { start_date: "2026-04-13", end_date: "2026-05-31" }
          ]);
        }
      } catch (error) {
        showErrorToast(error.message);
      }
    };

    loadData();
  }, []);

  const saveWeeks = async () => {
    try {
      if (!Number.isInteger(Number(semesterId)) || Number(semesterId) <= 0) {
        showErrorToast("Semester ID must be a positive integer");
        return;
      }
      await apiSaveSemesterWeeks({
        semester_id: Number(semesterId),
        intervals
      });
      showSuccessToast("Semester intervals saved");
      navigate("/dashboard/admin/users");
    } catch (error) {
      showErrorToast(error.message);
    }
  };

  const addInterval = () => setIntervals((prev) => [...prev, { start_date: "", end_date: "" }]);
  const deleteInterval = (index) => {
    if (index === 0) return;
    setIntervals((prev) => prev.filter((_, rowIndex) => rowIndex !== index));
  };

  return (
    <Box>
      <Typography variant="h5">Academic Weeks Setup</Typography>
      <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
        Choose one or more date intervals. You can add or remove intervals before saving.
      </Typography>
      <TextField
        size="small"
        type="number"
        inputProps={{ min: 1 }}
        label="Semester ID"
        value={semesterId}
        onChange={(e) => setSemesterId(e.target.value)}
        sx={{ mb: 2 }}
      />

      <Stack spacing={1}>
        {intervals.map((interval, index) => (
          <Stack key={`interval-${index}`} direction="row" spacing={1}>
            <TextField
              size="small"
              type="date"
              label="Interval start"
              InputLabelProps={{ shrink: true }}
              disabled={!canEdit}
              value={interval.start_date}
              onChange={(e) =>
                setIntervals((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, start_date: e.target.value } : row)))
              }
            />
            <TextField
              size="small"
              type="date"
              label="Interval end"
              InputLabelProps={{ shrink: true }}
              disabled={!canEdit}
              value={interval.end_date}
              onChange={(e) =>
                setIntervals((prev) => prev.map((row, rowIndex) => (rowIndex === index ? { ...row, end_date: e.target.value } : row)))
              }
            />
            <Button disabled={!canEdit || index === 0} color="error" variant="outlined" onClick={() => deleteInterval(index)}>
              Delete
            </Button>
          </Stack>
        ))}
      </Stack>

      <Typography sx={{ mt: 2 }}>
        Selected unique days: {totalDays}{startsOnMonday || totalDays === 0 ? "" : " (first selected day is not Monday)"}
      </Typography>

      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        <Button disabled={!canEdit} variant="outlined" onClick={addInterval}>Add interval</Button>
        <Button disabled={!canEdit} variant="contained" onClick={saveWeeks}>Save intervals</Button>
      </Stack>
    </Box>
  );
};

export default AdminSemesterWeeks;
