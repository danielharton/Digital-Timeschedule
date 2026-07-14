
import {
    Typography,
    TextField,
    Button,
    Box,
} from '@mui/material';
import { useEffect, useState } from 'react';

import { toast } from 'react-toastify';
import { storeToken } from '../utils/utilFunctions';

import { useNavigate } from 'react-router-dom';
import { showSuccessToast } from '../utils/utilFunctions';
import './login.css';
import { addStyleToTextField } from '../utils/utilFunctions';
import { getApiBaseUrl } from '../utils/apiBaseUrl';

const Login = () => {
    const navigate = useNavigate(); 
    const bgImage = `${process.env.PUBLIC_URL}/photo-1524995997946-a1c2e315a42f.avif`;

    useEffect(() => {
        document.body.classList.add('login-page');
        return () => document.body.classList.remove('login-page');
    }, []);

    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({
        email: '',
        password: '',
    });

   
    const validateForm = () => {
        let valid = true;
        let newErrors = {
            email: '',
            password: '',
        };

        if (!email) {
            newErrors.email = 'email-required';
            valid = false;
        }

        if (!password) {
            newErrors.password = 'password-required';
            valid = false;
        }

        setErrors(newErrors);
        return valid;
    };


    const login = async () => {
        if (!validateForm()) {
            return
        }

        console.log('login');

        const apiUrl = getApiBaseUrl();
        try {
            const response = await fetch(`${apiUrl}/api/users/login`, {
                method: 'POST', 
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                }), 
            });

            const contentType = response.headers.get('content-type') || '';
            const isJson = contentType.includes('application/json');
            const data = isJson ? await response.json() : null;

            if (!response.ok) {
                if (response.status === 401) {
                    showInvalidCredentials();
                } else {
                    toast.error(data?.message || 'something-went-wrong', {
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
                return;
            }

            if (data?.message === 'Successfully logged in!') {
                const token = response.headers.get('X-Auth-Token');
                if (token) {
                    storeToken(token)
                }
                showSuccessToast('login-success')
                navigate('/dashboard');

            } else {
                showInvalidCredentials()
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
        };

        newErrors.email = 'invalid-credentials';
        newErrors.password = 'invalid-credentials';

        setErrors(newErrors);
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            login()
        }
    };

    return (
        <>
            <div
                className="login-bg"
                style={{ backgroundImage: `url(${bgImage})` }}
            >
                {}
                <Box component="form" noValidate autoComplete="off"
                    onKeyDown={handleKeyPress} sx={{
                        width: '20%', margin: 'auto',
                        backgroundColor: 'white', padding: '20px', borderRadius: '10px'
                    }}>
                    <Typography variant="h4">Enter credentials</Typography>
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
                        label={'password'}
                        variant="outlined"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        error={!!errors.password}
                        helperText={errors.password}
                        sx={addStyleToTextField(password)}
                    />

                    <Button variant="contained" sx={{ backgroundColor: '#0d47a1', color: 'white', mb: 1, mt: 1 }} fullWidth onClick={login}>
                        {'login'}
                    </Button>

                </Box>
            </div>

        </>
    );
};

export default Login;
