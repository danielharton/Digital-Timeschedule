import { useEffect, useState } from "react";
import { Box, Typography } from "@mui/material";
import TimetableGrid from "../../components/TimetableGrid";
import { apiGetStudentSchedule } from "../../api/timetable";
import { showErrorToast } from "../../utils/utilFunctions";

const StudentSchedule = () => {
  const [schedule, setSchedule] = useState({ group: null, grid: {}, time_slots: [] });

  const loadData = async () => {
    try {
      const scheduleData = await apiGetStudentSchedule();
      setSchedule(scheduleData);
    } catch (error) {
      showErrorToast(error.message);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 5000); 
    return () => clearInterval(interval);
  }, []);

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Student Timetable</Typography>
      
      <TimetableGrid variant="student" grid={schedule.grid} timeSlots={schedule.time_slots || []} currentWeekType={schedule.current_week_type} />

      {schedule.group && (
        <Typography variant="subtitle1" sx={{ mt: 2, color: 'text.secondary' }}>
          {[
            schedule.group.numeric_group_code || schedule.group.group_name
              ? `Group: ${schedule.group.numeric_group_code || schedule.group.group_name}`
              : null,
            schedule.group.study_year != null ? `Year: ${schedule.group.study_year}` : null,
            schedule.group.series ? `Series: ${schedule.group.series}` : null,
            schedule.group.specialization ? `Specialization: ${schedule.group.specialization}` : null,
            schedule.group.faculty_display_name ? `Faculty: ${schedule.group.faculty_display_name}` : null,
            schedule.group.university_name ? schedule.group.university_name : null
          ]
            .filter(Boolean)
            .join(" | ")}
        </Typography>
      )}
    </Box>
  );
};

export default StudentSchedule;
