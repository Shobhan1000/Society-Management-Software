import { useState } from "react";
import { Sidebar, Menu, MenuItem, SubMenu } from "react-pro-sidebar";
import { Box, IconButton, Typography, useTheme } from "@mui/material";
import { Link } from "react-router-dom";
import { tokens } from "../../theme";

import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import UpdateOutlinedIcon from '@mui/icons-material/UpdateOutlined';
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import GroupOutlinedIcon from "@mui/icons-material/GroupOutlined";
import Groups2OutlinedIcon from "@mui/icons-material/Groups2Outlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import HistoryToggleOffOutlinedIcon from "@mui/icons-material/HistoryToggleOffOutlined";
import Diversity3OutlinedIcon from '@mui/icons-material/Diversity3Outlined';

// Sidebar menu item component
const Item = ({ title, to, icon, selected, setSelected }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <MenuItem
      active={selected === title}
      style={{ color: colors.grey[100] }}
      onClick={() => setSelected(title)}
      icon={icon}
      component={<Link to={to} />}
    >
      <Typography>{title}</Typography>
    </MenuItem>
  );
};

const SidebarComponent = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selected, setSelected] = useState("Dashboard");

  return (
    <Box
      sx={{
        "& .ps-sidebar-container": {
          background: `${colors.primary[400]} !important`,
        },
        "& .ps-menu-button": {
          padding: "5px 35px 5px 20px !important",
          color: `${colors.grey[100]} !important`,
        },
        "& .ps-menu-button:hover": {
          color: "#868dfb !important",
          background: "transparent !important",
        },
        "& .ps-menu-button.active": {
          color: "#6870fa !important",
        },
        "& .ps-submenu-content": {
          backgroundColor: `${colors.primary[400]} !important`,
        },
        height: "100vh",
        display: "flex",
      }}
    >
      <Sidebar collapsed={isCollapsed} style={{ height: "100%" }}>
        <Menu>
          {/* LOGO AND MENU ICON */}
          <MenuItem
            onClick={() => setIsCollapsed(!isCollapsed)}
            icon={isCollapsed ? <MenuOutlinedIcon /> : undefined}
            style={{
              margin: "10px 0 20px 0",
              color: colors.grey[100],
            }}
          >
            {!isCollapsed && (
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                ml="15px"
              >
                <Typography variant="h3" color={colors.grey[100]}>
                  ADMINIS
                </Typography>
                <IconButton onClick={() => setIsCollapsed(!isCollapsed)}>
                  <MenuOutlinedIcon />
                </IconButton>
              </Box>
            )}
          </MenuItem>

          {/* USER AREA */}
          {!isCollapsed && (
            <Box mb="25px">
              <Box display="flex" justifyContent="center" alignItems="center">
                <img
                  alt="profile-user"
                  width="100px"
                  height="100px"
                  src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='40' r='20' fill='%236873fa'/%3E%3Ccircle cx='50' cy='100' r='40' fill='%236873fa'/%3E%3C/svg%3E"
                  style={{ cursor: "pointer", borderRadius: "50%" }}
                />
              </Box>
              <Box textAlign="center">
                <Typography
                  variant="h2"
                  color={colors.grey[100]}
                  fontWeight="bold"
                  sx={{ m: "10px 0 0 0" }}
                >
                  Ed Roh
                </Typography>
                <Typography variant="h5" color={colors.greenAccent[500]}>
                  VP Fancy Admin
                </Typography>
              </Box>
            </Box>
          )}

          {/* MENU ITEMS */}
          <Box paddingLeft={isCollapsed ? undefined : "10%"}>

            <Item
              title="Dashboard"
              to="/"
              icon={<HomeOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            {/* PEOPLE DROPDOWN SECTION */}
            <SubMenu
              label="People"
              icon={<GroupOutlinedIcon />}
              style={{
                color: colors.grey[100],
              }}
              rootStyles={{
                ".ps-submenu-content": {
                  paddingLeft: isCollapsed ? 0 : "15px !important",
                },
              }}
            >
              <MenuItem
                icon={
                  <Diversity3OutlinedIcon
                    sx={{ fontSize: "18px !important" }}
                  />
                }
                component={<Link to="/people/members" />}
                onClick={() => setSelected("Members")}
                style={{
                  padding: "5px 10px",
                  marginLeft: "10px",
                  fontSize: "14px",
                }}
              >
                <Typography fontSize="14px">Members</Typography>
              </MenuItem>

              <MenuItem
                icon={
                  <Groups2OutlinedIcon
                    sx={{ fontSize: "18px !important" }}
                  />
                }
                component={<Link to="/people/committee" />}
                onClick={() => setSelected("Committee")}
                style={{
                  padding: "5px 10px",
                  marginLeft: "10px",
                  fontSize: "14px",
                }}
              >
                <Typography fontSize="14px">Committee</Typography>
              </MenuItem>
            </SubMenu>

            {/* EVENTS DROPDOWN SECTION */}
            <SubMenu
              label="Events"
              icon={<EventOutlinedIcon />}
              style={{
                color: colors.grey[100],
              }}
              rootStyles={{
                ".ps-submenu-content": {
                  paddingLeft: isCollapsed ? 0 : "15px !important",
                },
              }}
            >
              <MenuItem
                icon={
                  <EventAvailableOutlinedIcon
                    sx={{ fontSize: "18px !important" }}
                  />
                }
                component={<Link to="/events/plannedEvents" />}
                onClick={() => setSelected("Members")}
                style={{
                  padding: "5px 10px",
                  marginLeft: "10px",
                  fontSize: "14px",
                }}
              >
                <Typography fontSize="14px">Planned Events</Typography>
              </MenuItem>

              <MenuItem
                icon={
                  <DescriptionOutlinedIcon
                    sx={{ fontSize: "18px !important" }}
                  />
                }
                component={<Link to="/people/committee" />}
                onClick={() => setSelected("Committee")}
                style={{
                  padding: "5px 10px",
                  marginLeft: "10px",
                  fontSize: "14px",
                }}
              >
                <Typography fontSize="14px">Forms</Typography>
              </MenuItem>

              <MenuItem
                icon={
                  <CalendarTodayOutlinedIcon
                    sx={{ fontSize: "18px !important" }}
                  />
                }
                component={<Link to="/events/calendar" />}
                onClick={() => setSelected("Calendar")}
                style={{
                  padding: "5px 10px",
                  marginLeft: "10px",
                  fontSize: "14px",
                }}
              >
                <Typography fontSize="14px">Calendar</Typography>
              </MenuItem>

              <MenuItem
                icon={
                  <HistoryToggleOffOutlinedIcon
                    sx={{ fontSize: "18px !important" }}
                  />
                }
                component={<Link to="/people/committee" />}
                onClick={() => setSelected("Committee")}
                style={{
                  padding: "5px 10px",
                  marginLeft: "10px",
                  fontSize: "14px",
                }}
              >
                <Typography fontSize="14px">Past Events</Typography>
              </MenuItem>

            </SubMenu>

            <Item
              title="Finances"
              to="/finance"
              icon={<PointOfSaleIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <Item
              title="Communication"
              to="/communication"
              icon={<UpdateOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            <Item
              title="Analytics"
              to="/analytics"
              icon={<BarChartOutlinedIcon />}
              selected={selected}
              setSelected={setSelected}
            />
          </Box>
        </Menu>
      </Sidebar>
    </Box>
  );
};

export default SidebarComponent;