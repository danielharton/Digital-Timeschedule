import { Box, Button, TextField, Typography } from "@mui/material";
import { useEffect, useState, useRef } from "react";
import { apiAddSubject, apiGetSubjectById, apiUpdateSubject } from "../../api/subjects";
import { useNavigate, useParams } from "react-router-dom";
import { showErrorToast, showSuccessToast } from "../../utils/utilFunctions";
import { addStyleToTextField } from "../../utils/utilFunctions";

const AddEditSubject = () => {
    const navigate = useNavigate(); 
    const { subjectId } = useParams();

    const [formData, setFormData] = useState({
        subject: '',
    });


    useEffect(() => {

        if (subjectId && subjectId !== "0") {
            apiGetSubjectById((response) => {
                parseSubjectResponse(response.data);
            }, showErrorToast, subjectId)

        }
    }, [subjectId])

    const parseSubjectResponse = (data) => {

        setFormData({
            subject: data.subject,

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


        if (subjectId === '0') {
            apiAddSubject((response) => { navigate(-1); showSuccessToast(response.message) }, showErrorToast, formData)
        } else {
            apiUpdateSubject((response) => { navigate(-1) }, showErrorToast, subjectId, formData)
        }
    };

    return (
        <>
            <Box sx={{ m: 2 }}  >
                <Typography variant="h4">
                    <span className="font-bold text-black">{subjectId === "0" ? "Adauga disciplina" : "Editeaza disciplina"}</span>
                </Typography>

                <form onSubmit={handleSubmit}>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}  >
                        <TextField
                            label="Nume disciplina"
                            name="subject"
                            type='string'
                            value={formData.subject || ''}
                            fullWidth
                            margin="normal"
                            onChange={handleChange}
                            sx={addStyleToTextField(formData.subject)}
                        >
                        </TextField>

                        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 1 }}>
                            <Button type="submit" variant="contained" sx={{ mr: 1, mb: 1, backgroundColor: '#0d47a1', color: 'white' }}>
                                {subjectId === "0" ? 'Adauga disciplina' : 'Editeaza disciplina'}
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

export default AddEditSubject;