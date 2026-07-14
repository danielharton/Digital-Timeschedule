import { useEffect, useState } from "react";
import {
  Autocomplete,
  Box,
  TextField,
  Typography
} from "@mui/material";
import TimetableGrid from "../../components/TimetableGrid";
import { apiSearchTeacherGroups, apiGetTeacherGroupSchedule } from "../../api/timetable";
import { showErrorToast } from "../../utils/utilFunctions";

const TeacherGroupPlanner = ({ user }) => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [schedule, setSchedule] = useState({ grid: {}, time_slots: [] });

  useEffect(() => {
    const run = async () => {
      try {
        const data = await apiSearchTeacherGroups("");
        setGroups(data);
      } catch (error) {
        showErrorToast(error.message);
      }
    };
    run();
  }, []);

  const loadGroupSchedule = async (group) => {
    if (!group?.group_id) return;
    try {
      const data = await apiGetTeacherGroupSchedule(group.group_id);
      setSchedule(data);
    } catch (error) {
      showErrorToast(error.message);
    }
  };

  useEffect(() => {
    if (!selectedGroup) return;
    const interval = setInterval(() => {
      loadGroupSchedule(selectedGroup);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedGroup]);

  return (
    <Box>
      <Typography variant="h5">Group Timetable Viewer</Typography>
      <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>
        Search your associated group to view its timetable. Schedule changes are managed by administrators.
      </Typography>
      <Autocomplete
        options={groups}
        getOptionLabel={(option) => `${option.group_name} (Y${option.study_year}${option.series || ""})`}
        value={selectedGroup}
        onChange={(_e, value) => {
          setSelectedGroup(value);
          if (value) {
            loadGroupSchedule(value);
          } else {
            setSchedule({ grid: {}, time_slots: [] });
          }
        }}
        renderInput={(params) => <TextField {...params} label="Search group number" size="small" />}
      />

      <TimetableGrid
        grid={schedule.grid}
        timeSlots={schedule.time_slots || []}
        currentWeekType={schedule.current_week_type}
        highlightTeacherId={user?.data?.id}
      />
    </Box>
  );
};

export default TeacherGroupPlanner;
