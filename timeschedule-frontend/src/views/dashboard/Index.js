import { Typography } from "@mui/material";
import { Navigate } from "react-router-dom";
import { RIGHTS_MAPPING } from "../../utils/utilConstants";
const Dashboard = ({ userRights }) => {

    const rightCode = userRights[0]?.right_code;
    return (
        <>
            <Typography variant="h4">
                {}

                {rightCode === RIGHTS_MAPPING.ADMIN && (
                    <Navigate to="/dashboard/admin/users" />
                )}
                {rightCode === RIGHTS_MAPPING.TEACHER && (
                    <Navigate to="/dashboard/teacher/schedule" />
                )}
                {rightCode === RIGHTS_MAPPING.STUDENT && (
                    <Navigate to="/dashboard/student/schedule" />
                )}
            </Typography>
        </>
    )
}
export default Dashboard;