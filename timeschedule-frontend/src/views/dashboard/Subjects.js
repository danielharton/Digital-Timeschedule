import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiGetSubjects, apiGetSubjectsByStudentId, apiDeleteSubject, apiDeleteSubjectTeacher, apiAddSubjectTeacher, apiGetSubjectTeachersBySubjectId } from "../../api/subjects";
import { showErrorToast, showSuccessToast } from "../../utils/utilFunctions";
import { RIGHTS_MAPPING } from "../../utils/utilConstants";
import GenericTable from "../../components/GenericTable";
import dayjs from "dayjs";
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, CircularProgress,
    List, ListItem, ListItemText, IconButton, Box, Typography
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { apiSearchTeacherForSubject } from "../../api/user";
import { addStyleToTextField } from "../../utils/utilFunctions";
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LocalPhoneIcon from '@mui/icons-material/LocalPhone';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import GroupAddIcon from '@mui/icons-material/GroupAdd';

const columns = [
    { field: 'id', headerName: 'Nr.', type: 'string' },
    { field: 'subject', headerName: 'Nume', type: 'string' },
    {
        field: 'created_at', headerName: 'Data', type: 'date', renderCell: ({ value }) => {
            return dayjs(value).format('DD.MM.YYYY');
        }
    },

];

const Subjects = ({ userRights }) => {
    const navigate = useNavigate();
    const [data, setData] = useState([]);

    const rightCode = userRights[0]?.right_code;


    const [actions, setActions] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [subjectToDelete, setSubjectToDelete] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const [loading, setLoading] = useState(false);

    const [debounceTimeout, setDebounceTimeout] = useState(null);

    const [subjectId, setSubjectId] = useState(null);

    const [openAddSubjectDialog, setOpenAddSubjectDialog] = useState(false);

    useEffect(() => {
        if (rightCode === RIGHTS_MAPPING.ADMIN) {
            apiGetSubjects(
                (response) => {
                    if (response.data) {

                        setData(response.data);
                    }
                },
                showErrorToast
            );

            let actionsTmp = [];

            actionsTmp = [
                { icon: (<GroupAddIcon />), color: 'black', onClick: (id) => handleFetchTeachers(id) },
                { icon: <DeleteIcon />, color: '#0d47a1', onClick: handleOpenDialog },

            ];

            setActions(actionsTmp);
        } else if (rightCode === RIGHTS_MAPPING.COURIER) {
            apiGetSubjectsByStudentId(
                (response) => {
                    setData(response.data);

                },
                showErrorToast
            );

        }
    }, [data.length, rightCode]);



    
    const handleOpenDialog = (subjectId) => {
        setSubjectToDelete(subjectId); 
        setOpenDialog(true); 
    };


    const handleDeleteSubjectRequest = () => {
        apiDeleteSubject((response) => {
            showSuccessToast(response.message);
            const updatedData = data.filter((subject) => subject.id !== subjectToDelete);
            setData(updatedData);
            setOpenDialog(false);

        }, showErrorToast, subjectToDelete);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };


    const childrenData = data.reduce((acc, subject) => {
        const subjectId = subject.id;

        if (!acc[subjectId]) {
            acc[subjectId] = [];
        }
        if (subject.teachers && Array.isArray(subject.teachers)) {
            acc[subjectId].push(
                ...subject.teachers.map((teacher, idx) => ({
                    id: teacher.id || `${subjectId}-${idx}`,
                    name: teacher.name,
                    photo: teacher.photo,
                    email: teacher.email,
                    phone: teacher.phone,
                    created_at: dayjs(teacher.created_at).format('DD.MM.YYYY'),

                }))
            );

        }
        return acc;
    }, {});


    const [selectedTeachers, setSelectedTeachers] = useState([]);

    const handleFetchTeachers = (id) => {
        setSubjectId(id);
        setSelectedTeachers([]);

        apiGetSubjectTeachersBySubjectId((response) => {
            setSelectedTeachers(response.data);

        }, showErrorToast, id);

        setOpenAddSubjectDialog(true)
    };

    
    const fetchTeacherSearchResults = async (search) => {
        setLoading(true);
        try {
            await apiSearchTeacherForSubject((teachers) => {
                setSearchResults(teachers);
            }, showErrorToast, search);

        } catch (error) {
            console.error("Error fetching students:", error);
        } finally {
            setLoading(false);
        }
    };
    
    const handleSearchChange = (event) => {
        const value = event.target.value;
        setSearchTerm(value);
        
        if (debounceTimeout) {
            clearTimeout(debounceTimeout);
        }
        
        setDebounceTimeout(setTimeout(() => {
            if (value.trim()) {
                fetchTeacherSearchResults(value);
            } else {
                setSearchResults([]);
            }
        }, 500));
    }


    const handleAddTeacher = (teacher) => {
        setSelectedTeachers((prevTeachers) => {
            
            if (prevTeachers.some((o) => o.id === teacher.id)) {
                showErrorToast("Profesorul este deja selectat!");
                return prevTeachers;
            }
            return [...prevTeachers, teacher];
        });
        setData((prevData) =>
            prevData.map((item) => {
                
                const targetSubjectId = teacher.subject_id || subjectId;
                if (item.id === targetSubjectId) {
                    
                    if (item.teachers && item.teachers.some((o) => o.id === teacher.id)) {
                        return item;
                    }
                    return {
                        ...item,
                        teachers: [...(item.teachers || []), { ...teacher, subject_id: targetSubjectId }]
                    };
                }
                return item;
            })
        );

        console.log('teachers', teacher);
        apiAddSubjectTeacher((response) => {
            showSuccessToast(response.message);
        }, showErrorToast, subjectId, teacher.id);



        setSearchResults([]);
        setSearchTerm('');
    };
   
    const handleDeleteSuccess = (deletedTeacherId, response) => {
       
        setSelectedTeachers((prevTeachers) =>
            prevTeachers.filter((teacher) => teacher.id !== deletedTeacherId)
        );

        setData((prevData) =>
            prevData.map((route) => ({
                ...route,
                teachers: route.teachers
                    ? route.teachers.filter((teacher) => teacher.id !== deletedTeacherId)
                    : []
            }))
        );
        showSuccessToast(response.message);
    };
   
    const handleCloseAddSubjectDialog = () => {
        setOpenAddSubjectDialog(false);
        setSearchTerm('');
        setSearchResults([]);
        apiGetSubjects((response) => {
            setData(response.data)
        }, showErrorToast);


    };



    const handleAssignTeachersToSubject = () => {

        setOpenAddSubjectDialog(false);
        apiGetSubjects((response) => {
            setData(response.data)
        }, showErrorToast);

    }



    const childrenColumns = [
        { field: 'id', headerName: 'Nr.', type: 'string' },
        { field: 'name', headerName: 'Profesor' },
        { field: 'photo', headerName: 'Foto', type: 'filepath' },
        { field: 'email', headerName: 'Email' },
        { field: 'phone', headerName: 'Telefon' },
        { field: 'created_at', headerName: 'Data', type: 'date' },

    ];






    return (
        <>
            <GenericTable
                title={"Discipline"}
                columns={columns}
                data={data}
                buttonText={rightCode === RIGHTS_MAPPING.ADMIN && "Adauga disciplina"}
                buttonAction={() => {
                    if (rightCode === RIGHTS_MAPPING.ADMIN) {
                        navigate('/dashboard/addEditSubject/0');
                    }
                }}
                edit={rightCode === RIGHTS_MAPPING.ADMIN}
                onEdit={(id) => {
                    if (rightCode === RIGHTS_MAPPING.ADMIN) {
                        navigate(`/dashboard/addEditSubject/${id}`);
                    }
                }}
                actions={actions}
                childrenData={childrenData}
                childrenColumns={childrenColumns}
                isExtendedTable={true}
            >

            </GenericTable>

            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle></DialogTitle>
                <DialogContent>
                    Esti sigur ca vrei sa stergi disciplina?
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} sx={{ backgroundColor: '#0d47a1', color: 'white' }}>
                        Anuleaza
                    </Button>
                    <Button onClick={handleDeleteSubjectRequest} sx={{ backgroundColor: '#0d47a1', color: 'white' }}>
                        Sterge
                    </Button>
                </DialogActions>
            </Dialog>



            {}
            <Dialog open={openAddSubjectDialog} onClose={handleCloseAddSubjectDialog} fullWidth maxWidth="sm">
                <DialogTitle>Adauga profesori la disciplina</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Cauta profesori"
                        variant="outlined"
                        fullWidth
                        value={searchTerm}
                        onChange={handleSearchChange}
                        sx={{ ...addStyleToTextField(searchTerm), mt: 1 }}
                    />

                    {loading ? <CircularProgress /> : (
                        <List>
                            {searchResults.map((teacher) => (
                                <ListItem
                                    button
                                    key={teacher.id}
                                    onClick={() => handleAddTeacher(teacher)}
                                >
                                    <PersonIcon sx={{ mr: 1 }} />
                                    {teacher.name}
                                    <EmailIcon sx={{ mr: 1, ml: 1 }} />
                                    {teacher.email}
                                    <LocalPhoneIcon sx={{ mr: 1, ml: 1 }} />
                                    {teacher.phone}
                                    <PersonAddIcon sx={{ color: 'green', ml: 1 }} />
                                </ListItem>
                            ))}
                        </List>
                    )}
                    <Typography variant="h6" sx={{ marginTop: 2 }}>Studentii selectati:</Typography>
                    <List>
                        {selectedTeachers.map((teacher) => (
                            <ListItem
                                key={teacher.id}
                                secondaryAction={
                                    <IconButton edge="end" aria-label="delete" onClick={() => apiDeleteSubjectTeacher(
                                        (response) => handleDeleteSuccess(teacher.id, response),
                                        showErrorToast,
                                        subjectId,
                                    )} style={{ color: '#0d47a1' }}>
                                        <PersonRemoveIcon />
                                    </IconButton>
                                }
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <PersonIcon sx={{ mr: 1 }} />
                                    <ListItemText primary={teacher.name} />
                                    <EmailIcon sx={{ mr: 1, ml: 1 }} />
                                    <ListItemText primary={teacher.email} />
                                    <LocalPhoneIcon sx={{ mr: 1, ml: 1 }} />
                                    <ListItemText primary={teacher.phone} />
                                </Box>
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button variant="contained"
                        onClick={handleAssignTeachersToSubject}
                        sx={{
                            backgroundColor: '#0d47a1', color: 'white'
                        }}
                    >
                        Finalizeaza
                    </Button>

                </DialogActions>
            </Dialog>



        </>
    );
};

export default Subjects;