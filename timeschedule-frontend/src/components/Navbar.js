import React, { useState } from 'react';
import { AppBar, Toolbar, IconButton, Menu, MenuItem, Box, useTheme, Typography } from '@mui/material';
import { AccountCircle, Menu as MenuIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { removeToken } from '../utils/utilFunctions';


const Navbar = ({ onMenuClick, user, navigationButtons }) => {
    const navigate = useNavigate();
    const theme = useTheme();

    const [anchorEl, setAnchorEl] = useState(null);
    const isMenuOpen = Boolean(anchorEl)


    const handleProfileMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleLogoutClick = () => {
        handleMenuClose();
        removeToken();
        navigate('/auth');
    }

    const handleMenuClose = () => {
        setAnchorEl(null);
    };


    return (
        <AppBar position="fixed" sx={{ backgroundColor: '#0d47a1', zIndex: theme.zIndex.drawer + 1, color: 'white' }}>
            <Toolbar className="flex items-center justify-between">

                <IconButton
                    edge="start"
                    color="inherit"
                    aria-label="menu"
                    onClick={onMenuClick}
                >
                    <MenuIcon />
                </IconButton>

                <Box sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    width: '100%',
                    gap: '10px'
                }}>

                    <Typography variant="h6">
                        {user?.data ? `${user.data.first_name || ''} ${user.data.last_name || ''}`.trim() : ''}
                    </Typography>
                    {navigationButtons && navigationButtons.map((button, index) =>
                        <Box key={`navigationbutton${index}`}>
                            {button}
                        </Box>
                    )}

                    <IconButton
                        edge="end"
                        color="inherit"
                        onClick={handleProfileMenuOpen}
                        aria-controls="profile-menu"
                        aria-haspopup="true"
                    >
                        <AccountCircle />
                    </IconButton>
                </Box>
                <Menu
                    id="profile-menu"
                    anchorEl={anchorEl}
                    keepMounted
                    open={isMenuOpen}
                    onClose={handleMenuClose}
                >
                    {}
                    <MenuItem onClick={handleLogoutClick}>{'Logout'}</MenuItem>
                </Menu>

            </Toolbar>
        </AppBar>
    );
};

export default Navbar;
