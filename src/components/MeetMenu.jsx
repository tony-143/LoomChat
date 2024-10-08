import React, { Component } from "react";
import { Menu, MenuItem, IconButton, ListItemIcon, Typography } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import VideoCallIcon from "@mui/icons-material/VideoCall";
import SettingsIcon from "@mui/icons-material/Settings";
import HelpIcon from "@mui/icons-material/Help";

class MeetMenu extends Component {
    constructor(props) {
        super(props);
        this.state = {
            anchorEl: null,
        };
    }

    handleMenuOpen = (event) => {
        this.setState({ anchorEl: event.currentTarget });
    };

    handleMenuClose = () => {
        this.setState({ anchorEl: null });
    };

    render() {
        const { anchorEl } = this.state;
        const isMenuOpen = Boolean(anchorEl);

        return (
            <div>
                <IconButton
                    edge="end"
                    color="inherit"
                    aria-label="menu"
                    aria-controls="meet-menu"
                    aria-haspopup="true"
                    onClick={this.handleMenuOpen}
                >
                    <MoreVertIcon className="p-1" style={{fontSize:'45px',width:'35px', borderRadius:'20px',color: "white",background:'#393939' }}/>
                </IconButton>

                <Menu
                    id="meet-menu"
                    anchorEl={anchorEl}
                    open={isMenuOpen}
                    onClose={this.handleMenuClose}
                    keepMounted
                    anchorOrigin={{
                        vertical: "top",
                        horizontal: "left",
                    }}
                    transformOrigin={{
                        vertical: "top",
                        horizontal: "left",
                    }}
                    sx={{
                        mb: 10,
                        pb:10, // Adds a gap between the icon and the menu
                        "& .MuiPaper-root": {
                            backgroundColor: "black", // Black background
                            color: "white", // White text color
                        },
                    }}
                >
                    <MenuItem
                        onClick={this.handleMenuClose}
                        sx={{
                            "&:hover": {
                                backgroundColor: "#202124", // Darker gray on hover
                            },
                        }}
                    >
                        <ListItemIcon>
                            <FullscreenIcon fontSize="small" style={{ color: "white" }} />
                        </ListItemIcon>
                        <Typography variant="inherit" style={{ color: "white" }}>
                            Full screen
                        </Typography>
                    </MenuItem>
                    <MenuItem
                        onClick={this.handleMenuClose}
                        sx={{
                            "&:hover": {
                                backgroundColor: "#202124", // Darker gray on hover
                            },
                        }}
                    >
                        <ListItemIcon>
                            <ScreenShareIcon fontSize="small" style={{ color: "white" }} />
                        </ListItemIcon>
                        <Typography variant="inherit" style={{ color: "white" }}>
                            Screen Share
                        </Typography>
                    </MenuItem>
                    <MenuItem
                        onClick={this.handleMenuClose}
                        sx={{
                            "&:hover": {
                                backgroundColor: "#202124", // Darker gray on hover
                            },
                        }}
                    >
                        <ListItemIcon>
                            <VideoCallIcon fontSize="small" style={{ color: "white" }} />
                        </ListItemIcon>
                        <Typography variant="inherit" style={{ color: "white" }}>
                            Apply visual effects
                        </Typography>
                    </MenuItem>
                    <MenuItem
                        onClick={this.handleMenuClose}
                        sx={{
                            "&:hover": {
                                backgroundColor: "#202124", // Darker gray on hover
                            },
                        }}
                    >
                        <ListItemIcon>
                            <SettingsIcon fontSize="small" style={{ color: "white" }} />
                        </ListItemIcon>
                        <Typography variant="inherit" style={{ color: "white" }}>
                            Settings
                        </Typography>
                    </MenuItem>
                    <MenuItem
                        onClick={this.handleMenuClose}
                        sx={{
                            "&:hover": {
                                backgroundColor: "#202124", // Darker gray on hover
                            },
                        }}
                    >
                        <ListItemIcon>
                            <HelpIcon fontSize="small" style={{ color: "white" }} />
                        </ListItemIcon>
                        <Typography variant="inherit" style={{ color: "white" }}>
                            Help & Support
                        </Typography>
                    </MenuItem>
                </Menu>
            </div>
        );
    }
}

export default MeetMenu;
