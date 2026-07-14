import { getToken } from '../utils/utilFunctions';
import { getApiBaseUrl } from '../utils/apiBaseUrl';

export const apiAddClass = async (successCallback, errorCallback, classData) => {
    const apiUrl = getApiBaseUrl();
    const token = getToken();
    try {
        const response = await fetch(`${apiUrl}/api/classes/addClass`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(classData)
        });
        const data = await response.json();
        if (!data.success) {
            errorCallback(data.message);
        } else {
            successCallback(data);
        }
    } catch (error) {
        console.error('Error:', error);
        errorCallback({ success: false, message: "Failed to add class" });
    }
};

export const apiUpdateClass = async (successCallback, errorCallback, classId, updateData) => {
    const apiUrl = getApiBaseUrl();
    const token = getToken();
    try {
        const response = await fetch(`${apiUrl}/api/classes/updateClass/${classId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updateData)
        });
        const data = await response.json();
        if (!data.success) {
            errorCallback(data.message);
        } else {
            successCallback(data);
        }
    } catch (error) {
        console.error('Error:', error);
        errorCallback({ success: false, message: "Failed to update class" });
    }
};

export const apiDeleteClass = async (successCallback, errorCallback, classId) => {
    const apiUrl = getApiBaseUrl();
    const token = getToken();
    try {
        const response = await fetch(`${apiUrl}/api/classes/deleteClass/${classId}`, {
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
        errorCallback({ success: false, message: "Failed to delete class" });
    }
};


export const apiGetClassById = async (successCallback, errorCallback, classId) => {
    const apiUrl = getApiBaseUrl();
    const token = getToken();
    try {
        const response = await fetch(`${apiUrl}/api/classes/getClassById/${classId}`, {
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
        errorCallback({ success: false, message: "Failed to fetch class" });
    }
};

export const apiGetAllClasses = async (successCallback, errorCallback) => {
    const apiUrl = getApiBaseUrl();
    const token = getToken();
    try {
        const response = await fetch(`${apiUrl}/api/classes/getAllClasses`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });


        const data = await response.json();
        if (!data.success) {
            
        } else {
            successCallback(data);
        }
    } catch (error) {
        console.error('Error:', error);
        errorCallback({ success: false, message: "Failed to fetch classes" });
    }
};