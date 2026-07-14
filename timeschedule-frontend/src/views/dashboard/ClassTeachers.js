import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import GenericTable from "../../components/GenericTable";
import { showErrorToast, showSuccessToast } from "../../utils/utilFunctions";
import {
    Dialog, DialogActions, DialogContent, DialogTitle, Button, TextField, List,
    CircularProgress, Typography, ListItem, IconButton, ListItemText, Box
} from '@mui/material';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import { apiGetClassStudentsByClassId, apiAddClassStudent, apiDeleteClassStudent, apiGetClassStudentsByTeacherId, apiGetClassStudents } from "../../api/classStudents";
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import { RIGHTS_MAPPING } from "../../utils/utilConstants";
import LocalPhoneIcon from '@mui/icons-material/LocalPhone';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import dayjs from "dayjs";
import DeleteIcon from '@mui/icons-material/Delete';
import { addStyleToTextField } from "../../utils/utilFunctions";
import { apiSearchTeacher } from "../../api/user";
import { apiDeleteClass } from "../../api/classes";
import EditSquareIcon from '@mui/icons-material/EditSquare';
import { apiGetClassTeachers, apiAddClassTeacher, apiDeleteClassTeacher, apiGetClassTeachersByTeacherId, apiGetClassTeachersByClassId } from "../../api/classTeachers";


const ClassTeachers = ({ userRights }) => {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [actions, setActions] = useState([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const [loading, setLoading] = useState(false);

    const [debounceTimeout, setDebounceTimeout] = useState(null);

    const [classId, setClassId] = useState(null);

    const [openAddTeacherDialog, setOpenAddTeacherDialog] = useState(false);

    const rightCode = userRights[0]?.right_code;

    const [openDialog, setOpenDialog] = useState(false);
    const [classToDelete, setClassToDelete] = useState(null);


    let columns = [];
    if (rightCode === RIGHTS_MAPPING.ADMIN) {
        columns = [
            { field: 'id', headerName: 'Nr.', type: 'string' },
            { field: 'class_name', headerName: 'Clasa', type: 'string' },
            {
                field: 'created_at', headerName: 'Data', type: 'date', renderCell: ({ value }) => {
                    return dayjs(value).format('DD.MM.YYYY');
                }
            },

        ];
    } else {
        columns = [
            { field: 'id', headerName: 'Nr.', type: 'string' },
            { field: 'class_name', headerName: 'Clasa', type: 'string' },
            {
                field: 'created_at', headerName: 'Data', type: 'date', renderCell: ({ value }) => {
                    return dayjs(value).format('DD.MM.YYYY');
                }
            },

        ];
    }

    useEffect(() => {
        if (rightCode === RIGHTS_MAPPING.ADMIN) {
            apiGetClassTeachers((response) => {
                setData(response.data)
            }, showErrorToast);
        }


    }, [data.length, rightCode]);


    useEffect(() => {
        let actionsTmp = [];

        actionsTmp = [
            { icon: <EditSquareIcon />, color: 'black', onClick: (id) => navigate(`/dashboard/addEditClass/${id}`) },
            { icon: (<GroupAddIcon />), color: 'black', onClick: (id) => handleFetchTeachers(id) },
            { icon: <DeleteIcon />, color: '#0d47a1', onClick: handleOpenDialog },


        ];

        setActions(actionsTmp);
    }, []);

    const [selectedTeachers, setSelectedTeachers] = useState([]);

    const handleFetchTeachers = (id) => {
        setClassId(id);
        setSelectedTeachers([]);

        apiGetClassTeachersByClassId((response) => {
            setSelectedTeachers(response.data);

        }, showErrorToast, id);

        setOpenAddTeacherDialog(true)
    };

    
    const fetchTeacherSearchResults = async (search) => {
        setLoading(true);
        try {
            await apiSearchTeacher((teachers) => {
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
                
                const targetClassId = teacher.class_id || classId;
                if (item.id === targetClassId) {
                    
                    if (item.teachers && item.teachers.some((o) => o.id === teacher.id)) {
                        return item;
                    }
                    return {
                        ...item,
                        teachers: [...(item.teachers || []), { ...teacher, class_id: targetClassId }]
                    };
                }
                return item;
            })
        );

        console.log('teachers', teacher);
        apiAddClassTeacher((response) => {
            showSuccessToast(response.message);
        }, showErrorToast, classId, teacher.id);



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
   
    const handleCloseAddTeacherDialog = () => {
        setOpenAddTeacherDialog(false);
        setSearchTerm('');
        setSearchResults([]);
        apiGetClassTeachers((response) => {
            setData(response.data)
        }, showErrorToast);


    };


    const childrenData = data.reduce((acc, item) => {
        const classId = item.id;

        if (!acc[classId]) {
            acc[classId] = [];
        }
        if (item.teachers && Array.isArray(item.teachers)) {
            acc[classId].push(
                ...item.teachers.map((teacher, idx) => ({
                    id: teacher.id || `${classId}-${idx}`,
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



    const childrenColumns = [
        { field: 'id', headerName: 'Nr.', type: 'string' },
        { field: 'name', headerName: 'Profesor' },
        { field: 'photo', headerName: 'Foto', type: 'filepath' },
        { field: 'email', headerName: 'Email' },
        { field: 'phone', headerName: 'Telefon' },
        { field: 'created_at', headerName: 'Data', type: 'date' },

    ];

    const handleAssignTeachersToClass = () => {

        setOpenAddTeacherDialog(false);
        apiGetClassTeachers((response) => {
            setData(response.data)
        }, showErrorToast);

    }


    
    const handleOpenDialog = (classId) => {
        setClassToDelete(classId); 
        setOpenDialog(true); 
    };


    const handleDeleteClassRequest = () => {
        console.log('classToDelete', classToDelete);
        apiDeleteClass((response) => {
            showSuccessToast(response.message);
            const updatedData = data.filter((item) => item.id !== classToDelete);
            setData(updatedData);
            setOpenDialog(false);

        }, showErrorToast, classToDelete);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };


    return (
        <>
            <GenericTable
                actions={rightCode === RIGHTS_MAPPING.ADMIN && actions}
                title={"Profesori"}
                buttonText={rightCode === RIGHTS_MAPPING.ADMIN && "Adauga clasa"}
                buttonAction={() => {
                    if (rightCode === RIGHTS_MAPPING.ADMIN) {
                        navigate('/dashboard/addEditClass/0')
                    }
                }}
                columns={columns}
                data={data}
                childrenColumns={childrenColumns}
                childrenData={childrenData}
                isExtendedTable={true}

            />

            {}
            <Dialog open={openAddTeacherDialog} onClose={handleCloseAddTeacherDialog} fullWidth maxWidth="sm">
                <DialogTitle>Adauga profesori la clasa</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Cauta studenti"
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
                                    <IconButton edge="end" aria-label="delete" onClick={() => apiDeleteClassTeacher(
                                        (response) => handleDeleteSuccess(teacher.id, response),
                                        showErrorToast,
                                        classId,
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
                        onClick={handleAssignTeachersToClass}
                        sx={{
                            backgroundColor: '#0d47a1', color: 'white'
                        }}
                    >
                        Finalizeaza
                    </Button>

                </DialogActions>
            </Dialog>

            <Dialog open={openDialog} onClose={handleCloseDialog}>
                <DialogTitle>Stergere clasa</DialogTitle>
                <DialogContent>
                    Esti sigur ca vrei sa stergi clasa?
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} sx={{ backgroundColor: '#0d47a1', color: 'white' }}>
                        Anuleaza
                    </Button>
                    <Button onClick={handleDeleteClassRequest} sx={{ backgroundColor: '#0d47a1', color: 'white' }}>
                        Sterge
                    </Button>
                </DialogActions>
            </Dialog>

        </>
    );
};
export default ClassTeachers;