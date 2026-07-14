import { getToken } from "../utils/utilFunctions";
import { getApiBaseUrl } from "../utils/apiBaseUrl";

export const apiRegister = async (successCallback, errorCallback, userData) => {
    const apiUrl = getApiBaseUrl();
    try {
        const response = await fetch(`${apiUrl}/api/users/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData),
        });

        const data = await response.json();
        if (!data.success) {
            errorCallback(data.message);
        } else {
            successCallback(data);
        }
    } catch (error) {
        console.error('Error:', error);
        errorCallback({ success: false, message: "Registration failed" });
    }
};

export const apiLogin = async (successCallback, errorCallback, credentials) => {
    const apiUrl = getApiBaseUrl();
    try {
        const response = await fetch(`${apiUrl}/api/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(credentials),
        });

        const data = await response.json();
        if (!data.success) {
            errorCallback(data.message);
        } else {
            
            const token = response.headers.get('X-Auth-Token');
            successCallback({ ...data, token });
        }
    } catch (error) {
        console.error('Error:', error);
        errorCallback({ success: false, message: "Login failed" });
    }
};

















































export const apiGetTeachers = async (successCallback, errorCallback) => {
    const apiUrl = getApiBaseUrl();
    const token = getToken();
    try {
        const response = await fetch(`${apiUrl}/api/users/getTeachers`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (!data.success) {
            errorCallback(data.message);
        } else {
            successCallback(data);
        }
    } catch (error) {
        console.error('Error:', error);
        errorCallback({ success: false, message: "Failed to fetch teachers" });
    }
};

export const apiSearchStudent = async (successCallback, errorCallback, searchField) => {
    const apiUrl = getApiBaseUrl();
    const token = getToken();
    try {
        const response = await fetch(`${apiUrl}/api/users/searchStudent?searchField=${searchField}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.status === 204) {
            successCallback([])
        } else {
            const data = await response.json();
            if (!data.success) {
                errorCallback(data.message);
            } else {
                successCallback(data.data);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        errorCallback({ success: false, message: "Failed to fetch students" });
    }
};

export const apiGetUsers = async (successCallback, errorCallback) => {
    const apiUrl = getApiBaseUrl();
    const token = getToken();
    try {
        const response = await fetch(`${apiUrl}/api/users/getUsers`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (!data.success) {
            errorCallback(data.message);
        } else {
            successCallback(data);
        }
    } catch (error) {
        console.error('Error:', error);
        errorCallback({ success: false, message: "Failed to fetch users" });
    }
};

export const apiDeleteUser = async (successCallback, errorCallback, userId) => {
    const apiUrl = getApiBaseUrl();
    const token = getToken();
    try {
        const response = await fetch(`${apiUrl}/api/users/deleteUser/${userId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (!data.success) {
            errorCallback(data.message);
        } else {
            successCallback(data);
        }
    } catch (error) {
        console.error('Error:', error);
        errorCallback({ success: false, message: "Failed to delete user" });
    }
};

export const apiSearchTeacher = async (successCallback, errorCallback, searchField) => {
    const apiUrl = getApiBaseUrl();
    const token = getToken();
    try {
        const response = await fetch(`${apiUrl}/api/users/searchTeacher?searchField=${searchField}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.status === 204) {
            successCallback([])
        } else {
            const data = await response.json();
            if (!data.success) {
                errorCallback(data.message);
            } else {
                successCallback(data.data);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        errorCallback({ success: false, message: "Failed to fetch teachers" });
    }
};

export const apiSearchTeacherForSubject = async (successCallback, errorCallback, searchField) => {
    const apiUrl = getApiBaseUrl();
    const token = getToken();
    try {
        const response = await fetch(`${apiUrl}/api/users/searchTeacherForSubject?searchField=${searchField}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.status === 204) {
            successCallback([])
        } else {
            const data = await response.json();
            if (!data.success) {
                errorCallback(data.message);
            } else {
                successCallback(data.data);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        errorCallback({ success: false, message: "Failed to fetch teachers" });
    }
};


