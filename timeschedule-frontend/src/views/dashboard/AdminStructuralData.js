import React, { useState, useEffect, useCallback } from "react";
import { Box, Typography, Stack, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import { apiGetMeta } from "../../api/timetable";
import { showErrorToast, showSuccessToast } from "../../utils/utilFunctions";

import { getHeaders } from "../../api/timetable";
const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8080";

const genericCreate = async (endpoint, payload) => {
  const res = await fetch(`${apiUrl}/api/structural/${endpoint}`, {
    method: "POST", headers: getHeaders(), body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to create");
  return await res.json();
};

const genericDelete = async (endpoint, id) => {
  const res = await fetch(`${apiUrl}/api/structural/${endpoint}/${id}`, {
    method: "DELETE", headers: getHeaders()
  });
  if (!res.ok) throw new Error("Failed to delete");
  return await res.json();
};

const genericUpdate = async (endpoint, id, payload) => {
  const res = await fetch(`${apiUrl}/api/structural/${endpoint}/${id}`, {
    method: "PUT", headers: getHeaders(), body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to update");
  return await res.json();
};

const AdminStructuralData = () => {
  const [meta, setMeta] = useState({});
  const [progForm, setProgForm] = useState({ program_name: "", faculty_name: "", university_name: "", cycle: "Licenta", duration_years: 3 });
  const [bldForm, setBldForm] = useState({ building_code: "", name: "" });
  const [roomForm, setRoomForm] = useState({ room_code: "", capacity: 30, building_id: "" });
  const [editingProgId, setEditingProgId] = useState(null);
  const [editingProgData, setEditingProgData] = useState({ program_name: "", faculty_name: "", university_name: "", cycle: "", duration_years: 3 });

  const loadData = useCallback(async () => {
    try {
      const data = await apiGetMeta();
      setMeta(data);
    } catch (e) {
      showErrorToast(e.message);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreate = async (endpoint, payload, resetFormFn) => {
    try {
      await genericCreate(endpoint, payload);
      showSuccessToast("Created successfully");
      resetFormFn();
      loadData();
    } catch (e) { showErrorToast(e.message); }
  };

  const handleDelete = async (endpoint, id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await genericDelete(endpoint, id);
      showSuccessToast("Deleted successfully");
      loadData();
    } catch (e) { showErrorToast(e.message); }
  };

  const handleUpdateProg = async (id) => {
    try {
      await genericUpdate("study_programs", id, editingProgData);
      showSuccessToast("Updated successfully");
      setEditingProgId(null);
      loadData();
    } catch (e) { showErrorToast(e.message); }
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Typography variant="h5" sx={{ mb: 4 }}>Study Program Manager</Typography>

      <Stack spacing={4}>
        {}
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Study Programs</Typography>
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <TextField size="small" label="Program Name" value={progForm.program_name} onChange={e => setProgForm({...progForm, program_name: e.target.value})} />
            <TextField size="small" label="Faculty Name" value={progForm.faculty_name} onChange={e => setProgForm({...progForm, faculty_name: e.target.value})} />
            <TextField size="small" label="University Name" value={progForm.university_name} onChange={e => setProgForm({...progForm, university_name: e.target.value})} />
            <TextField size="small" label="Cycle" value={progForm.cycle} onChange={e => setProgForm({...progForm, cycle: e.target.value})} />
            <TextField size="small" type="number" label="Duration (Years)" value={progForm.duration_years} onChange={e => setProgForm({...progForm, duration_years: Number(e.target.value)})} />
            <Button variant="contained" onClick={() => handleCreate("study_programs", progForm, () => setProgForm({ program_name: "", faculty_name: "", university_name: "", cycle: "Licenta", duration_years: 3 }))}>Add</Button>
          </Stack>
          <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
            <Table stickyHeader size="small">
              <TableHead><TableRow><TableCell>ID</TableCell><TableCell>Name</TableCell><TableCell>Faculty</TableCell><TableCell>University</TableCell><TableCell>Cycle</TableCell><TableCell>Duration</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
              <TableBody>
                {(meta.study_programs || []).map(p => (
                  <TableRow key={p.program_id}>
                    <TableCell>{p.program_id}</TableCell>
                    {editingProgId === p.program_id ? (
                      <>
                        <TableCell><TextField size="small" value={editingProgData.program_name} onChange={e => setEditingProgData({...editingProgData, program_name: e.target.value})} /></TableCell>
                        <TableCell><TextField size="small" value={editingProgData.faculty_name} onChange={e => setEditingProgData({...editingProgData, faculty_name: e.target.value})} /></TableCell>
                        <TableCell><TextField size="small" value={editingProgData.university_name} onChange={e => setEditingProgData({...editingProgData, university_name: e.target.value})} /></TableCell>
                        <TableCell><TextField size="small" value={editingProgData.cycle} onChange={e => setEditingProgData({...editingProgData, cycle: e.target.value})} /></TableCell>
                        <TableCell><TextField size="small" type="number" value={editingProgData.duration_years} onChange={e => setEditingProgData({...editingProgData, duration_years: Number(e.target.value)})} /></TableCell>
                        <TableCell>
                          <Button color="primary" size="small" onClick={() => handleUpdateProg(p.program_id)}><SaveIcon/></Button>
                          <Button color="secondary" size="small" onClick={() => setEditingProgId(null)}><CloseIcon/></Button>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>{p.program_name}</TableCell>
                        <TableCell>{p.faculty_name}</TableCell>
                        <TableCell>{p.university_name}</TableCell>
                        <TableCell>{p.cycle}</TableCell>
                        <TableCell>{p.duration_years}</TableCell>
                        <TableCell>
                          <Button color="primary" size="small" onClick={() => { setEditingProgId(p.program_id); setEditingProgData({ program_name: p.program_name, faculty_name: p.faculty_name, university_name: p.university_name, cycle: p.cycle, duration_years: p.duration_years }); }}><EditIcon/></Button>
                          <Button color="error" size="small" onClick={() => handleDelete("study_programs", p.program_id)}><DeleteIcon/></Button>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {}
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Buildings</Typography>
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <TextField size="small" label="Code" value={bldForm.building_code} onChange={e => setBldForm({...bldForm, building_code: e.target.value})} />
            <TextField size="small" label="Name" value={bldForm.name} onChange={e => setBldForm({...bldForm, name: e.target.value})} />
            <Button variant="contained" onClick={() => handleCreate("buildings", bldForm, () => setBldForm({ building_code: "", name: "" }))}>Add</Button>
          </Stack>
          <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
            <Table stickyHeader size="small">
              <TableHead><TableRow><TableCell>ID</TableCell><TableCell>Code</TableCell><TableCell>Name</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
              <TableBody>
                {(meta.buildings || []).map(b => (
                  <TableRow key={b.building_id}>
                    <TableCell>{b.building_id}</TableCell><TableCell>{b.building_code}</TableCell><TableCell>{b.name}</TableCell>
                    <TableCell><Button color="error" size="small" onClick={() => handleDelete("buildings", b.building_id)}><DeleteIcon/></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {}
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>Rooms</Typography>
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <TextField size="small" label="Room Code" value={roomForm.room_code} onChange={e => setRoomForm({...roomForm, room_code: e.target.value})} />
            <TextField size="small" type="number" label="Capacity" value={roomForm.capacity} onChange={e => setRoomForm({...roomForm, capacity: Number(e.target.value)})} />
            <TextField size="small" type="number" label="Building ID" value={roomForm.building_id} onChange={e => setRoomForm({...roomForm, building_id: Number(e.target.value)})} />
            <Button variant="contained" onClick={() => handleCreate("rooms", roomForm, () => setRoomForm({ room_code: "", capacity: 30, building_id: "" }))}>Add</Button>
          </Stack>
          <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
            <Table stickyHeader size="small">
              <TableHead><TableRow><TableCell>ID</TableCell><TableCell>Room Code</TableCell><TableCell>Building</TableCell><TableCell>Actions</TableCell></TableRow></TableHead>
              <TableBody>
                {(meta.rooms || []).map(r => (
                  <TableRow key={r.room_id}>
                    <TableCell>{r.room_id}</TableCell><TableCell>{r.room_code}</TableCell><TableCell>{r.building_code} (ID: {r.building_id})</TableCell>
                    <TableCell><Button color="error" size="small" onClick={() => handleDelete("rooms", r.room_id)}><DeleteIcon/></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

      </Stack>
    </Box>
  );
};

export default AdminStructuralData;
