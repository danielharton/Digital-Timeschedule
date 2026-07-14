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
import { apiSearchStudent } from "../../api/user";
import { apiDeleteClass } from "../../api/classes";
import EditSquareIcon from '@mui/icons-material/EditSquare';


const ClassStudents = ({ userRights }) => {
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [actions, setActions] = useState([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const [loading, setLoading] = useState(false);

    const [debounceTimeout, setDebounceTimeout] = useState(null);

    const [classId, setClassId] = useState(null);

    const [openAddCourierDialog, setOpenAddCourierDialog] = useState(false);

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
            apiGetClassStudents((response) => {
                setData(response.data)
            }, showErrorToast);
        } else if (rightCode === RIGHTS_MAPPING.TEACHER) {
            apiGetClassStudentsByTeacherId((response) => {
                setData(response.data)
            }, showErrorToast);
        }


    }, [data.length, rightCode]);


    useEffect(() => {
        let actionsTmp = [];

        actionsTmp = [
            { icon: <EditSquareIcon />, color: 'black', onClick: (id) => navigate(`/dashboard/addEditClass/${id}`) },
            { icon: (<GroupAddIcon />), color: 'black', onClick: (id) => handleFetchStudents(id) },
            { icon: <DeleteIcon />, color: '#0d47a1', onClick: handleOpenDialog },


        ];

        setActions(actionsTmp);
    }, []);

    const [selectedStudents, setSelectedStudents] = useState([]);

    const handleFetchStudents = (id) => {
        setClassId(id);
        setSelectedStudents([]);

        apiGetClassStudentsByClassId((response) => {
            setSelectedStudents(response.data);

        }, showErrorToast, id);

        setOpenAddCourierDialog(true)
    };

    
    const fetchStudentSearchResults = async (search) => {
        setLoading(true);
        try {
            await apiSearchStudent((students) => {
                setSearchResults(students);
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
                fetchStudentSearchResults(value);
            } else {
                setSearchResults([]);
            }
        }, 500));
    }


    const handleAddStudent = (student) => {
        setSelectedStudents((prevStudents) => {
            
            if (prevStudents.some((o) => o.id === student.id)) {
                showErrorToast("Studentul este deja selectat!");
                return prevStudents;
            }
            return [...prevStudents, student];
        });
        setData((prevData) =>
            prevData.map((item) => {
                
                const targetClassId = student.class_id || classId;
                if (item.id === targetClassId) {
                    
                    if (item.students && item.students.some((o) => o.id === student.id)) {
                        return item;
                    }
                    return {
                        ...item,
                        students: [...(item.students || []), { ...student, class_id: targetClassId }]
                    };
                }
                return item;
            })
        );

        console.log('students', student);
        apiAddClassStudent((response) => {
            showSuccessToast(response.message);
        }, showErrorToast, classId, student.id);



        setSearchResults([]);
        setSearchTerm('');
    };
   
    const handleDeleteSuccess = (deletedStudentId, response) => {
       
        setSelectedStudents((prevStudents) =>
            prevStudents.filter((student) => student.id !== deletedStudentId)
        );

        setData((prevData) =>
            prevData.map((route) => ({
                ...route,
                students: route.students
                    ? route.students.filter((student) => student.id !== deletedStudentId)
                    : []
            }))
        );
        showSuccessToast(response.message);
    };
   
    const handleCloseAddCourierDialog = () => {
        setOpenAddCourierDialog(false);
        setSearchTerm('');
        setSearchResults([]);
        apiGetClassStudents((response) => {
            setData(response.data)
        }, showErrorToast);


    };


    const childrenData = data.reduce((acc, item) => {
        const classId = item.id;

        if (!acc[classId]) {
            acc[classId] = [];
        }
        if (item.students && Array.isArray(item.students)) {
            acc[classId].push(
                ...item.students.map((student, idx) => ({
                    id: student.id || `${classId}-${idx}`,
                    name: student.name,
                    photo: student.photo,
                    email: student.email,
                    phone: student.phone,
                    created_at: dayjs(student.created_at).format('DD.MM.YYYY'),

                }))
            );

        }
        return acc;
    }, {});



    const childrenColumns = [
        { field: 'id', headerName: 'Nr.', type: 'string' },
        { field: 'name', headerName: 'Student' },
        { field: 'photo', headerName: 'Foto', type: 'filepath' },
        { field: 'email', headerName: 'Email' },
        { field: 'phone', headerName: 'Telefon' },
        { field: 'created_at', headerName: 'Data', type: 'date' },

    ];

    const handleAssignStudentsToClass = () => {

        setOpenAddCourierDialog(false);
        apiGetClassStudents((response) => {
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
                title={"Studenti"}
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
            <Dialog open={openAddCourierDialog} onClose={handleCloseAddCourierDialog} fullWidth maxWidth="sm">
                <DialogTitle>Adauga studenti la clasa</DialogTitle>
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
                            {searchResults.map((student) => (
                                <ListItem
                                    button
                                    key={student.id}
                                    onClick={() => handleAddStudent(student)}
                                >
                                    <PersonIcon sx={{ mr: 1 }} />
                                    {student.name}
                                    <EmailIcon sx={{ mr: 1, ml: 1 }} />
                                    {student.email}
                                    <LocalPhoneIcon sx={{ mr: 1, ml: 1 }} />
                                    {student.phone}
                                    <PersonAddIcon sx={{ color: 'green', ml: 1 }} />
                                </ListItem>
                            ))}
                        </List>
                    )}
                    <Typography variant="h6" sx={{ marginTop: 2 }}>Studentii selectati:</Typography>
                    <List>
                        {selectedStudents.map((student) => (
                            <ListItem
                                key={student.id}
                                secondaryAction={
                                    <IconButton edge="end" aria-label="delete" onClick={() => apiDeleteClassStudent(
                                        (response) => handleDeleteSuccess(student.id, response),
                                        showErrorToast,
                                        student.id,
                                    )} style={{ color: '#0d47a1' }}>
                                        <PersonRemoveIcon />
                                    </IconButton>
                                }
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <PersonIcon sx={{ mr: 1 }} />
                                    <ListItemText primary={student.name} />
                                    <EmailIcon sx={{ mr: 1, ml: 1 }} />
                                    <ListItemText primary={student.email} />
                                    <LocalPhoneIcon sx={{ mr: 1, ml: 1 }} />
                                    <ListItemText primary={student.phone} />
                                </Box>
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button variant="contained"
                        onClick={handleAssignStudentsToClass}
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
export default ClassStudents;