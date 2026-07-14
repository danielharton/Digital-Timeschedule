import { getToken } from '../utils/utilFunctions';
import { getApiBaseUrl } from '../utils/apiBaseUrl';

export const apiAddClassStudent = async (successCallback, errorCallback, classId, studentId) => {
    const apiUrl = getApiBaseUrl();
    const token = getToken();
    try {
        const response = await fetch(`${apiUrl}/api/classStudents/addClassStudent/${classId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ student_id: studentId })
        });
        const data = await response.json();
        if (!data.success) {
            errorCallback(data.message);
        } else {
            successCallback(data);
        }
    } catch (error) {
        console.error('Error:', error);
        errorCallback({ success: false, message: "Failed to add class student" });
    }
};


export const apiDeleteClassStudent = async (successCallback, errorCallback, studentId) => {
    const apiUrl = getApiBaseUrl();
    const token = getToken();
    try {
        const response = await fetch(`${apiUrl}/api/classStudents/deleteClassStudent/${studentId}`, {
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
        errorCallback({ success: false, message: "Failed to delete class student" });
    }
};


export const apiGetClassStudentsByClassId = async (successCallback, errorCallback, classId) => {
    const apiUrl = getApiBaseUrl();
    const token = getToken();
    try {
        const response = await fetch(`${apiUrl}/api/classStudents/getClassStudentsByClassId/${classId}`, {
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
        errorCallback({ success: false, message: "Failed to fetch class students" });
    }
};

export const apiGetClassStudentsByTeacherId = async (successCallback, errorCallback) => {
    const apiUrl = getApiBaseUrl();
    const token = getToken();
    try {
        const response = await fetch(`${apiUrl}/api/classStudents/getClassStudentsByTeacherId`, {
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
        errorCallback({ success: false, message: "Failed to fetch class students" });
    }
};

export const apiGetClassStudents = async (successCallback, errorCallback) => {
    const apiUrl = getApiBaseUrl();
    const token = getToken();
    try {
        const response = await fetch(`${apiUrl}/api/classStudents/getClassStudents`, {
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
        errorCallback({ success: false, message: "Failed to fetch class students" });
    }
};




