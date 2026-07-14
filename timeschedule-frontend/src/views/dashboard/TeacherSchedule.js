import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import TimetableGrid from "../../components/TimetableGrid";
import GenericTable from "../../components/GenericTable";
import { showErrorToast } from "../../utils/utilFunctions";
import {
  apiGetHistory,
  apiGetTeacherSchedule
} from "../../api/timetable";

const TeacherSchedule = () => {

  const [schedule, setSchedule] = useState({ grid: {}, time_slots: [], assigned_students: [] });
  const [history, setHistory] = useState([]);

  const refreshAll = async () => {
    try {
      const [scheduleData, historyData] = await Promise.all([
        apiGetTeacherSchedule(),
        apiGetHistory()
      ]);
      setSchedule(scheduleData);
      setHistory(historyData);
    } catch (error) {
      showErrorToast(error.message);
    }
  };

  useEffect(() => {
    refreshAll();
    const interval = setInterval(() => {
      refreshAll();
    }, 5000); 
    return () => clearInterval(interval);
  }, []);



  return (
    <Box>
      <Typography variant="h5">Teacher Timetable</Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>
        Your schedule is managed by administrators. Contact an admin to make changes.
      </Typography>

      <TimetableGrid
        grid={schedule.grid}
        timeSlots={schedule.time_slots || []}
        currentWeekType={schedule.current_week_type}
      />

      <Typography variant="h6" sx={{ mt: 3 }}>Assigned students</Typography>
      <GenericTable
        columns={[
          { field: "first_name", headerName: "First name" },
          { field: "last_name", headerName: "Last name" },
          { field: "email_address", headerName: "Email" },
          { field: "group_name", headerName: "Group" },
          { field: "study_year", headerName: "Year" },
          { field: "series", headerName: "Series" }
        ]}
        data={(schedule.assigned_students || []).map((x) => ({ ...x, id: x.user_id }))}
      />


      <Typography variant="h6" sx={{ mt: 3 }}>Schedule change history</Typography>
      <GenericTable
        columns={[
          { field: "created_at", headerName: "When" },
          { field: "action_type", headerName: "Action" },
          { field: "first_name", headerName: "By first name" },
          { field: "last_name", headerName: "By last name" },
          { field: "schedule_entry_id", headerName: "Entry ID" }
        ]}
        data={(history || []).map((x) => ({ ...x, id: x.log_id }))}
      />
    </Box>
  );
};

export default TeacherSchedule;
