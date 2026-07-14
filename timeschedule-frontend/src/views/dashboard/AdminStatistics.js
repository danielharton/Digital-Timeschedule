import React, { useEffect, useState } from "react";
import { Box, Typography, Grid, Card, CardContent } from "@mui/material";
import { apiGetAdminStatistics } from "../../api/timetable";
import { showErrorToast } from "../../utils/utilFunctions";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#ffc658"];

const AdminStatistics = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiGetAdminStatistics();
        setStats(data);
      } catch (err) {
        showErrorToast(err.message);
      }
    };
    fetchStats();
  }, []);

  if (!stats) return <Box sx={{ p: 2 }}><Typography>Loading statistics...</Typography></Box>;

  
  const roomOcc = stats.roomOccupancy || [];
  const mostOccupied = roomOcc.length > 0 ? roomOcc[0] : null;
  const leastOccupied = roomOcc.length > 0 ? roomOcc[roomOcc.length - 1] : null;

  const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const paddedDays = allDays.map(d => ({
    name: d,
    value: stats.scheduleByDay?.find(x => x.name === d)?.value || 0
  }));

  const allYears = ["Year 1", "Year 2", "Year 3", "Year 4"];
  const paddedYears = allYears.map(y => ({
    name: y,
    value: stats.groupsByYear?.find(x => x.name === y)?.value || 0
  }));

  const bottom15Rooms = [...roomOcc].reverse().slice(0, 15);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Statistics Dashboard
      </Typography>

      {}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card elevation={3}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Users
              </Typography>
              <Typography variant="h5">
                {stats.userDistribution?.reduce((acc, curr) => acc + curr.value, 0) || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card elevation={3}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Most Occupied Room
              </Typography>
              <Typography variant="h5">
                {mostOccupied ? `${mostOccupied.name} (${mostOccupied.value} slots)` : "N/A"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card elevation={3}>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Least Occupied Room
              </Typography>
              <Typography variant="h5">
                {leastOccupied ? `${leastOccupied.name} (${leastOccupied.value} slots)` : "N/A"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%' }}>
        {}
        <Card elevation={2} style={{ width: '100%' }}>
          <CardContent>
            <Typography variant="h6" align="center" gutterBottom>Activities by Day</Typography>
            <ResponsiveContainer width="99%" height={300}>
              <BarChart data={paddedDays} margin={{ top: 20, right: 30, left: 20, bottom: 20 }} maxBarSize={60}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" type="category" interval={0} tick={{ fontSize: 12 }} />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {}
        <Card elevation={2} style={{ width: '100%' }}>
          <CardContent>
            <Typography variant="h6" align="center" gutterBottom>Groups per Study Year</Typography>
            <ResponsiveContainer width="99%" height={300}>
              <BarChart data={paddedYears} margin={{ top: 20, right: 30, left: 20, bottom: 20 }} maxBarSize={60}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" type="category" interval={0} tick={{ fontSize: 12 }} />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {}
        <Card elevation={2} style={{ width: '100%' }}>
          <CardContent>
            <Typography variant="h6" align="center" gutterBottom>Room Occupancy Ranking (Top 15)</Typography>
            <ResponsiveContainer width="99%" height={300}>
              <BarChart data={stats.roomOccupancy?.slice(0, 15)} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <RechartsTooltip />
                <Bar dataKey="value" fill="#ffc658" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {}
        <Card elevation={2} style={{ width: '100%' }}>
          <CardContent>
            <Typography variant="h6" align="center" gutterBottom>Least Occupied Room Ranking</Typography>
            <ResponsiveContainer width="99%" height={300}>
              <BarChart data={bottom15Rooms} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <RechartsTooltip />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {}
        <Card elevation={2} style={{ width: '100%' }}>
          <CardContent>
            <Typography variant="h6" align="center" gutterBottom>User Distribution</Typography>
            <ResponsiveContainer width="99%" height={300}>
              <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <Pie data={stats.userDistribution} cx="50%" cy="50%" dataKey="value" label>
                  {stats.userDistribution?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {}
        <Card elevation={2} style={{ width: '100%' }}>
          <CardContent>
            <Typography variant="h6" align="center" gutterBottom>Activity Types</Typography>
            <ResponsiveContainer width="99%" height={300}>
              <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <Pie data={stats.activityTypes} cx="50%" cy="50%" dataKey="value" label>
                  {stats.activityTypes?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </Box>
  );
};

export default AdminStatistics;
