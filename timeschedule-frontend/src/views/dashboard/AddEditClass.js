import { Box, Button, TextField, Typography, List, ListItemButton, ListItemText } from "@mui/material";
import { useEffect, useState, useRef } from "react";
import { apiGetTeachers } from "../../api/user";
import { useNavigate, useParams } from "react-router-dom";
import { showErrorToast, showSuccessToast } from "../../utils/utilFunctions";
import { addStyleToTextField } from "../../utils/utilFunctions";
import { apiGetClassById, apiAddClass, apiUpdateClass } from "../../api/classes";
import { apiGetSubjects } from "../../api/subjects";

const AddEditClass = ({ userRights }) => {
    const navigate = useNavigate(); 
    const { classId } = useParams();

    const [teacherSearchTerm, setTeacherSearchTerm] = useState('');
    const [teacherSearchResults, setTeacherSearchResults] = useState([]);


    const [subjectSearchTerm, setSubjectSearchTerm] = useState('');
    const [subjectSearchResults, setSubjectSearchResults] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [subjects, setSubjects] = useState([]);

    const rightCode = userRights[0].right_code;

    const [formData, setFormData] = useState({
        name: '',
    });


    useEffect(() => {
        apiGetTeachers((response) => {
            setTeachers(response.data);
        }, showErrorToast);

        apiGetSubjects((response) => {
            setSubjects(response.data);
        }, showErrorToast);
    }, [rightCode]);



    useEffect(() => {

        if (classId && classId !== "0") {
            apiGetClassById((response) => {
                parseClassResponse(response.data);
            }, showErrorToast, classId)

        }
    }, [classId])

    const parseClassResponse = (data) => {

        setFormData({
            name: data.name,

        });
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();


        if (classId === '0') {
            apiAddClass((response) => { navigate(-1); showSuccessToast(response.message) }, showErrorToast, formData)
        } else {
            apiUpdateClass((response) => { navigate(-1) }, showErrorToast, classId, formData)
        }
    };


    const handleTeacherSearchChange = (event) => {
        const value = event.target.value;
        setTeacherSearchTerm(value);

        console.log('teachers', teachers);
        if (value.trim()) {
            const searchTermLower = value.trim().toLowerCase();
            const filtered = teachers.filter(teacher => {

                if (teacher && teacher.name) {
                    return teacher.name.toLowerCase().includes(searchTermLower);
                }
                return false;
            });
            setTeacherSearchResults(filtered);
        } else {
            setTeacherSearchResults([]);
        }

    };


    const handleSubjectSearchChange = (event) => {
        const value = event.target.value;
        setSubjectSearchTerm(value);

        console.log('subjects', subjects);

        if (value.trim()) {
            const searchTermLower = value.trim().toLowerCase();
            const filtered = subjects.filter(subject => {

                if (subject && subject.subject) {
                    return subject.subject.toLowerCase().includes(searchTermLower);
                }
                return false;
            });
            setSubjectSearchResults(filtered);
        } else {
            setSubjectSearchResults([]);
        }
    };


    const handleAddTeacher = (teacher) => {

        setTeacherSearchTerm(teacher.name);
        setTeacherSearchResults([]);

        formData.teacher_id = teacher.id;

        setTeacherSearchResults([]);

    };

    

    
    

    

    

    

    return (
        <>
            <Box sx={{ m: 2 }}  >
                <Typography variant="h4">
                    <span className="font-bold text-black">{classId === "0" ? "Adauga clasa" : "Editeaza clasa"}</span>
                </Typography>

                <form onSubmit={handleSubmit}>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}  >
                        <TextField
                            label="Nume clasa"
                            name="name"
                            type='string'
                            value={formData.name || ''}
                            fullWidth
                            margin="normal"
                            onChange={handleChange}
                            sx={addStyleToTextField(formData.name)}
                        >
                        </TextField>

                        {}



                        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 1 }}>
                            <Button type="submit" variant="contained" sx={{ mr: 1, mb: 1, backgroundColor: '#0d47a1', color: 'white' }}>
                                {classId === "0" ? 'Adauga clasa' : 'Editeaza clasa'}
                            </Button>
                            <Button variant="contained" color="error" sx={{ mb: 1 }} onClick={() => navigate(-1)}>
                                Renunta
                            </Button>
                        </Box>
                    </Box>
                </form>
            </Box>
        </>
    )
}

export default AddEditClass;