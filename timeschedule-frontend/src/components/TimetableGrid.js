import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, Divider } from "@mui/material";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const parseTimeToMinutes = (timeValue) => {
  const cleaned = timeValue.replace(/\s/g, "");
  const [hours, minutes] = cleaned.split(":").map((x) => Number(x));
  return hours * 60 + minutes;
};

const slotRange = (slotLabel) => {
  const parts = slotLabel.split("-");
  if (parts.length !== 2) return { start: 0, end: 0 };
  return { start: parseTimeToMinutes(parts[0]), end: parseTimeToMinutes(parts[1]) };
};


const inactiveSx = {
  opacity: 0.45,
  background:
    "repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(0,0,0,0.08) 4px, rgba(0,0,0,0.08) 6px)",
  color: "#888",
  px: 1,
  py: 0.5
};

const activeSx = {
  px: 1,
  py: 0.5
};

const weekTypeLabel = (weekType) => {
  if (!weekType || weekType === "ALL") return null;
  if (weekType === "ODD") return "Odd week";
  if (weekType === "EVEN") return "Even week";
  return weekType;
};


const ActivityBlock = ({ act, isStudent, isInactive, isHighlighted }) => {
  const sx = isInactive ? inactiveSx : activeSx;
  const finalSx = isHighlighted && !isInactive ? { ...sx, color: "#0d47a1" } : sx;
  const parityLine = weekTypeLabel(act.week_type);

  return (
    <Box sx={finalSx}>
      <div>
        <b>{act.subject_name || act.subject}</b> ({act.activity_type})
      </div>
      {isStudent && (act.teacher_name || (act.teacher_first_name && act.teacher_last_name)) && (
        <div>{act.teacher_name || `${act.teacher_first_name} ${act.teacher_last_name}`}</div>
      )}
      <div>Room: {act.room || act.room_code}</div>
      {!isStudent && (act.group_name || act.series) && (
        <div>
          {act.activity_type === "course" ? `Series: ${act.series || act.group_name}` : `Group: ${act.group_name}`}
        </div>
      )}
      {parityLine && <div>{parityLine}</div>}
    </Box>
  );
};

const TimetableGrid = ({ grid, timeSlots, onCellClick, clickable = false, variant = "default", currentWeekType, highlightTeacherId }) => {
  const isStudent = variant === "student";
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const todayDay = days[(now.getDay() + 6) % 7];
  const slotRanges = timeSlots.map((slot) => ({ slot, ...slotRange(slot) }));

  return (
    <TableContainer component={Paper} sx={{ mt: 2 }}>
      <Table size="small" sx={{ borderCollapse: "separate", borderSpacing: 0 }}>
        <TableHead>
          <TableRow>
<TableCell sx={{ width: 80, minWidth: 80, p: 1 }}>
  <b>Time</b>
</TableCell>
{days.map((day) => (
  <TableCell key={day}>
    <b>{day}</b>
  </TableCell>
))}
</TableRow>
</TableHead>
<TableBody>
{timeSlots.map((slot) => (
  <TableRow key={slot}>
    <TableCell sx={{ width: 80, minWidth: 80, p: 1, verticalAlign: "top", fontSize: "0.85rem" }}>
      <div>{slot.split("-")[0].trim()} -</div>
      <div>{slot.split("-")[1].trim()}</div>
    </TableCell>
              {days.map((day) => {
                const cell = grid?.[slot]?.[day];
                const { start, end } = slotRange(slot);
                const isCurrent = day === todayDay && currentMinutes >= start && currentMinutes < end;
                const currentSlotIndex = slotRanges.findIndex((x) => currentMinutes >= x.start && currentMinutes < x.end);
                const nextSlot = currentSlotIndex >= 0 && currentSlotIndex + 1 < slotRanges.length ? slotRanges[currentSlotIndex + 1] : null;
                const isBreakToNext = currentSlotIndex >= 0 && nextSlot && currentMinutes >= slotRanges[currentSlotIndex].end && currentMinutes < nextSlot.start;
                const isNextAfterBreak = day === todayDay && isBreakToNext && nextSlot.slot === slot;
                const isCurrentCell = Boolean(cell) && (isCurrent || isNextAfterBreak);
                const activities = cell ? (cell.activities || [cell]) : [];
                const hasActiveHighlight = activities.some(act => 
                  highlightTeacherId && 
                  act.teacher_id === highlightTeacherId && 
                  !(currentWeekType && act.week_type !== "ALL" && act.week_type !== currentWeekType)
                );

                const baseSx = {
                  cursor: clickable ? "pointer" : "default",
                  border: isCurrentCell ? "2px solid #2e7d32" : "2px solid #bdbdbd",
                  boxSizing: "border-box",
                  backgroundClip: "padding-box",
                  backgroundColor: hasActiveHighlight ? "#e3f2fd" : "inherit",
                  p: 0,
                  verticalAlign: "top",
                  "&:hover": {
                    border: isCurrentCell ? "2px solid #d32f2f" : "2px solid #1565c0"
                  }
                };

                let activeActForUrl = null;
                let hasUrl = false;
                if (!clickable && activities.length > 0) {
                  activeActForUrl = activities.find(a => !(currentWeekType && a.week_type !== "ALL" && a.week_type !== currentWeekType)) || activities[0];
                  if (activeActForUrl && activeActForUrl.online_url) {
                    hasUrl = true;
                  }
                }

                const handleCellClick = () => {
                  if (clickable) {
                    onCellClick?.({ slot, day, cell });
                  } else if (hasUrl && activeActForUrl) {
                    let url = activeActForUrl.online_url;
                    if (url) {
                      if (!url.startsWith("http")) url = "https://" + url;
                      window.open(url, "_blank");
                    }
                  }
                };

                const cellSx = {
                  ...baseSx,
                  cursor: (clickable || hasUrl) ? "pointer" : "default"
                };

                if (!cell) {
                  return (
                    <TableCell key={`${slot}-${day}`} sx={{ ...cellSx, p: 1 }} onClick={handleCellClick}>
                      -
                    </TableCell>
                  );
                }

                if (activities.length > 1) {
                  return (
                    <TableCell key={`${slot}-${day}`} sx={cellSx} onClick={handleCellClick}>
                      {activities.map((act, idx) => {
                        const isInactive = currentWeekType && act.week_type !== "ALL" && act.week_type !== currentWeekType;
                        return (
                          <Box key={act.schedule_entry_id || idx}>
                            {idx > 0 && <Divider sx={{ borderColor: "#999" }} />}
                            <ActivityBlock 
                              act={act} 
                              isStudent={isStudent} 
                              isInactive={isInactive} 
                              isHighlighted={highlightTeacherId && act.teacher_id === highlightTeacherId}
                            />
                          </Box>
                        );
                      })}
                    </TableCell>
                  );
                }

                const act = activities[0];
                const isInactive = currentWeekType && act.week_type !== "ALL" && act.week_type !== currentWeekType;

                return (
                  <TableCell key={`${slot}-${day}`} sx={cellSx} onClick={handleCellClick}>
                    <ActivityBlock 
                      act={act} 
                      isStudent={isStudent} 
                      isInactive={isInactive} 
                      isHighlighted={highlightTeacherId && act.teacher_id === highlightTeacherId}
                    />
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default TimetableGrid;
