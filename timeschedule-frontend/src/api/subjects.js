import { getToken } from '../utils/utilFunctions';
import { getApiBaseUrl } from '../utils/apiBaseUrl';

export const apiAddSubject = async (successCallback, errorCallback, subjectData) => {
    const apiUrl = getApiBaseUrl();
    const token = getToken();
    try {
        const response = await fetch(`${apiUrl}/api/subjects/addSubject`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(subjectData)
        });
        const data = await response.json();
        if (!data.success) {
            errorCallback(data.message);
        } else {
            successCallback(data);
        }
    } catch (error) {
        console.error('Error:', error);
        errorCallback({ success: false, message: "Failed to add subject" });
    }
};

export const apiUpdateSubject = async (successCallback, errorCallback, subjectId, updateData) => {
    const apiUrl = getApiBaseUrl();
    const token = getToken();
    try {
        const response = await fetch(`${apiUrl}/api/subjects/updateSubject/${subjectId}`, {
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

export const apiDeleteSubject = async (successCallback, errorCallback, subjectId) => {
    const apiUrl = getApiBaseUrl();
    const token = getToken();
    try {
        const response = await fetch(`${apiUrl}/api/subjects/deleteSubject/${subjectId}`, {
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
        errorCallback({ success: false, message: "Failed to delete subject" });
    }
};


export const apiGetSubjectById = async (successCallback, errorCallback, subjectId) => {
    const apiUrl = getApiBaseUrl();
    const token = getToken();
    try {
        const response = await fetch(`${apiUrl}/api/subjects/getSubject/${subjectId}`, {
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
        errorCallback({ success: false, message: "Failed to fetch subject" });
    }
};

export const apiGetSubjects = async (successCallback, errorCallback) => {
    const apiUrl = getApiBaseUrl();
    const token = getToken();
    try {
        const response = await fetch(`${apiUrl}/api/subjects/getSubjects`, {
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
        errorCallback({ success: false, message: "Failed to fetch subjects" });
    }
};

export const apiGetSubjectsByStudentId = async (successCallback, errorCallback, studentId) => {
    const apiUrl = getApiBaseUrl();
    const token = getToken();
    try {
        const response = await fetch(`${apiUrl}/api/subjects/getSubjectsByStudentId/${studentId}`, {
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
        errorCallback({ success: false, message: "Failed to fetch subjects" });
    }
};

export const apiSearchSubject = async (successCallback, errorCallback, searchField) => {
    const apiUrl = getApiBaseUrl();
    const token = getToken();
    try {
        const response = await fetch(`${apiUrl}/api/subjects/searchSubject?searchField=${searchField}`, {
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
        errorCallback({ success: false, message: "Failed to fetch subjects" });
    }
};

export const apiDeleteSubjectTeacher = async (successCallback, errorCallback, teacherId) => {
    const apiUrl = getApiBaseUrl();
    const token = getToken();
    try {
        const response = await fetch(`${apiUrl}/api/subjects/deleteSubjectTeacher/${teacherId}`, {
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


export const apiAddSubjectTeacher = async (successCallback, errorCallback, subjectId, teacherId) => {
    const apiUrl = getApiBaseUrl();
    const token = getToken();
    try {
        const response = await fetch(`${apiUrl}/api/subjects/addSubjectTeacher/${subjectId}`, {
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
        errorCallback({ success: false, message: "Failed to add subject" });
    }
};

export const apiGetSubjectTeachersBySubjectId = async (successCallback, errorCallback, subjectId) => {
    const apiUrl = getApiBaseUrl();
    const token = getToken();
    try {
        const response = await fetch(`${apiUrl}/api/subjects/getSubjectTeachersBySubjectId/${subjectId}`, {
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
        errorCallback({ success: false, message: "Failed to fetch subject teachers" });
    }
};

export const apiGetSubjectsByTeacherId = async (successCallback, errorCallback) => {
    const apiUrl = getApiBaseUrl();
    const token = getToken();
    try {
        const response = await fetch(`${apiUrl}/api/subjects/getSubjectsByTeacherId`, {
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
        errorCallback({ success: false, message: "Failed to fetch subjects" });
    }
};
