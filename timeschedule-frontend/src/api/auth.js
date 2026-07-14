import { getToken } from "../utils/utilFunctions";
import { getApiBaseUrl } from "../utils/apiBaseUrl";

export const apiCheckLogin = async (errorCallBack, setUser) => {
    const apiUrl = getApiBaseUrl();
    const token = getToken();
    try {
        const response = await fetch(`${apiUrl}/api/users/checkLogin`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
            if (errorCallBack) {
                errorCallBack(data?.message || 'Authentication failed');
            }
        } else {
            if (setUser) {
                setUser(data);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        if (errorCallBack) {
            errorCallBack('Authentication failed');
        }
    }
}