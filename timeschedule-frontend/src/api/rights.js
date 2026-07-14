import { getToken } from "../utils/utilFunctions";
import { getApiBaseUrl } from "../utils/apiBaseUrl";

export const apiGetUserRights = async (setUserRights) => {
    const apiUrl = getApiBaseUrl();
    const token = getToken();
    try {
        const response = await fetch(`${apiUrl}/api/rights/getUserRights`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        if (!data.success) {
        } else {
            setUserRights(data.data)
        }
    } catch (error) {
        console.error('Error:', error);
    }
}
