import React from 'react';
import { List, ListItemButton, ListItemText, Collapse, Drawer, Box, ListItemIcon } from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom'; 
import { menus } from '../utils/menus';
import { shouldShowMenu } from '../utils/utilFunctions';

const Sidebar = ({ open, onClose, userRights, }) => {

  const location = useLocation();
  const [openedCatgory, setOpenedCatgory] = React.useState(null);
  const url = location.pathname;

  console.log('userRights', userRights);

  const handleCategoryClick = (menuId) => {
    if (menuId === openedCatgory) {
      setOpenedCatgory(null)
    } else {
      setOpenedCatgory(menuId)
    }
  };

  const isActive = (path) => location.pathname === path

  return (
    <Drawer
      variant={open ? 'persistent' : 'temporary'}
      open={open}
      onClose={onClose}
      sx={{
        backgroundColor: "#FFFFFF",
        width: 280,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 280,
          boxSizing: 'border-box',
          top: 64, 
          height: 'calc(100% - 64px)', 
        },
      }}
      anchor="left"
    >
      <Box sx={{ p: 2 }}>
        <List>
          {url.includes("dashboard") && menus.map(menu => {
            
            if (shouldShowMenu(userRights, menu))
              if (menu.isCategory) {
                return <Box key={`menu_${menu.id}`} ><ListItemButton sx={{ padding: "2px 4px 2px 4px" }} onClick={() => { handleCategoryClick(menu.id) }}>
                  {menu.icon && (
                    <ListItemIcon sx={{ minWidth: 'auto', marginRight: '5px' }}>
                      <menu.icon />  {}
                    </ListItemIcon>
                  )}
                  <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary={menu.name} />
                  {openedCatgory === menu.id ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                  <Collapse in={openedCatgory === menu.id} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {menu.children.map(child => {
                        if (shouldShowMenu(userRights, child))
                          return <Box key={`childmenu_${child.id}`} sx={{ ml: 4 }} className={isActive(child.to) ? 'bg-gray-300' : 'transparent'} >
                            <ListItemButton sx={{ padding: "2px 4px 2px 4px" }} key={`menu_child_${child.id}`} component={Link} to={child.to}>
                              <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary={child.name} />
                            </ListItemButton>
                          </Box>
                        return null;
                      })}
                    </List>
                  </Collapse>
                </Box>

              } else {
                return <Box key={`menu_${menu.id}`} className={isActive(menu.to) ? 'bg-gray-300' : 'transparent'}>
                  <ListItemButton sx={{ padding: "2px 4px 2px 4px" }} component={Link} to={menu.to}>
                    {menu.icon && (
                      <ListItemIcon sx={{ minWidth: 'auto', marginRight: '5px' }}>
                        <menu.icon color="primary" />  {}
                      </ListItemIcon>
                    )}
                    <ListItemText primaryTypographyProps={{ fontSize: '14px' }} primary={menu.name} />
                  </ListItemButton>
                </Box>
              }
            return null;
          })}

        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
