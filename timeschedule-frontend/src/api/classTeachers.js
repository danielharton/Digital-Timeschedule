import { getToken } from '../utils/utilFunctions';
import { getApiBaseUrl } from '../utils/apiBaseUrl';

export const apiAddClassTeacher = async (successCallback, errorCallback, classId, teacherId) => {
    const apiUrl = getApiBaseUrl();
    const token = getToken();
    try {
        const response = await fetch(`${apiUrl}/api/classTeachers/addClassTeacher/${classId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ teacher_id: teacherId })
        });
        const data = await response.json();
        if (!data.success) {
            errorCallback(data.message);
        } else {
            successCallback(data);
        }
    } catch (error) {
        console.error('Error:', error);
        errorCallback({ success: false, message: "Failed to add class teacher" });
    }
};


export const apiDeleteClassTeacher = async (successCallback, errorCallback, teacherId) => {
    const apiUrl = getApiBaseUrl();
    const token = getToken();
    try {
        const response = await fetch(`${apiUrl}/api/classTeachers/deleteClassTeacher/${teacherId}`, {
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
        errorCallback({ success: false, message: "Failed to delete class teacher" });
    }
};


export const apiGetClassTeachersByClassId = async (successCallback, errorCallback, classId) => {
    const apiUrl = getApiBaseUrl();
    const token = getToken();
    try {
        const response = await fetch(`${apiUrl}/api/classTeachers/getClassTeachersByClassId/${classId}`, {
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
        errorCallback({ success: false, message: "Failed to fetch class teachers" });
    }
};

export const apiGetClassTeachersByTeacherId = async (successCallback, errorCallback) => {
    const apiUrl = getApiBaseUrl();
    const token = getToken();
    try {
        const response = await fetch(`${apiUrl}/api/classTeachers/getClassTeachersByTeacherId`, {
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
        errorCallback({ success: false, message: "Failed to fetch class teachers" });
    }
};

export const apiGetClassTeachers = async (successCallback, errorCallback) => {
    const apiUrl = getApiBaseUrl();
    const token = getToken();
    try {
        const response = await fetch(`${apiUrl}/api/classTeachers/getClassTeachers`, {
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
        errorCallback({ success: false, message: "Failed to fetch class teachers" });
    }
};




