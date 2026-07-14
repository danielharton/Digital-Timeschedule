
import {
    Typography,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Grid
} from '@mui/material';
import { useState } from 'react';

import { toast } from 'react-toastify';
import { storeToken } from '../../utils/utilFunctions';

import { useNavigate } from 'react-router-dom';
import { showSuccessToast, showErrorToast } from '../../utils/utilFunctions';

import { addStyleToTextField } from "../../utils/utilFunctions";
import { getApiBaseUrl } from "../../utils/apiBaseUrl";


const AddUser = () => {
    const navigate = useNavigate(); 
    
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [rightCode, setRightCode] = useState('');
    const [phone, setPhone] = useState('');
    const [errors, setErrors] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        rightCode: '',
        phone: '',
    });

    const register = async () => {

        const apiUrl = getApiBaseUrl();
       
        try {
            const response = await fetch(`${apiUrl}/api/users/register`, {
                method: 'POST', 
                headers: {
                    'Content-Type': 'application/json',
                    
                },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    password: password,
                    confirm_password: confirmPassword,
                    right_code: rightCode,
                    phone: phone
                }), 
            });

            const data = await response.json();

            if (data.message === 'Utilizatorul a fost creat cu succes') {
                const token = response.headers.get('X-Auth-Token');
                if (token) {
                    storeToken(token)
                }
                showSuccessToast(data.message)
                navigate('/dashboard/users');

            } else {
                showInvalidCredentials()
                showErrorToast(data.message)
            }
        } catch (error) {
            console.error('Error:', error);

            toast.error('something-went-wrong', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: "light",
            });
        }
    }

    const showInvalidCredentials = () => {

        let newErrors = {
            email: '',
            password: '',
            confirmPassword: '',
            rightCode: '',
            name: '',
            phone: '',
        };

        if (!email) {
            newErrors.email = 'invalid-credentials';
        }
        if (!password) {
            newErrors.password = 'invalid-credentials';
        }
        if (!confirmPassword) {
            newErrors.confirmPassword = 'invalid-credentials';
        }
        if (!rightCode) {
            newErrors.rightCode = 'invalid-credentials';
        }
        if (!phone) {
            newErrors.phone = 'invalid-credentials';
        }
        if (!name) {
            newErrors.name = 'invalid-credentials';
        }

        setErrors(newErrors);
    }

    const handleKeyPress = (e) => {
        if (e.key == 'Enter') {
            register()
        }
    };

    return (
        <>

            <Box noValidate autoComplete="off"
                onKeyDown={handleKeyPress} sx={{
                    m: 2
                }}>
                <Typography variant="h4">Adauga utilizator</Typography>

                <TextField
                    fullWidth
                    margin="normal"
                    label="Nume"
                    variant="outlined"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    error={!!errors.name}
                    helperText={errors.name}
                    sx={addStyleToTextField(name)}
                />
                <TextField
                    fullWidth
                    margin="normal"
                    label="Email"
                    variant="outlined"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={!!errors.email}
                    helperText={errors.email}
                    sx={addStyleToTextField(email)}
                />
                <TextField
                    fullWidth
                    margin="normal"
                    label={'Parola'}
                    variant="outlined"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={!!errors.password}
                    helperText={errors.password}
                    sx={addStyleToTextField(password)}
                />


                <TextField
                    fullWidth
                    margin="normal"
                    label={'Confirmare parola'}
                    variant="outlined"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword}
                    sx={addStyleToTextField(confirmPassword)}
                />

                <TextField
                    fullWidth
                    margin="normal"
                    label={'Telefon'}
                    variant="outlined"
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    error={!!errors.phone}
                    helperText={errors.phone}
                    sx={{ ...addStyleToTextField(phone), mb: 2 }}
                />


                <FormControl fullWidth>
                    <InputLabel id="rightCode-label">Rol</InputLabel>
                    <Select
                        label={'Rol'}
                        labelId="rightCode-label"
                        name="rightCode"
                        value={rightCode}
                        onChange={(e) => setRightCode(e.target.value)}
                        sx={addStyleToTextField(rightCode)}

                    >
                        <MenuItem value={1}>Profesor</MenuItem>
                        <MenuItem value={2}>Student</MenuItem>
                        <MenuItem value={3}>Admin</MenuItem>
                    </Select>
                </FormControl>


                <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 2 }}>
                    <Button variant="contained" sx={{ backgroundColor: '#0d47a1', color: 'white', mb: 1, mr: 1 }} onClick={register}>
                        {'Inregistreaza utilizator'}
                    </Button>

                    <Button variant="contained" color="error" sx={{ mb: 1 }} onClick={() => navigate(-1)}>
                        Renunta
                    </Button>
                </Box>

            </Box>


        </>
    );
};

export default AddUser;
