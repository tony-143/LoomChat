import React, { useState } from 'react';
import { Button, Menu, MenuItem } from '@mui/material';

function MeetingDropdown({handleCreateMeeting}) {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      {/* Button with custom yellow color and shadow */}
      <Button
        onClick={handleClick}
        aria-controls="meeting-menu"
        aria-haspopup="true"
        sx={{
          backgroundColor: '#0D6EFD',
          color: 'white',
          '&:hover': {
            backgroundColor: '#6C757D', // Darker shade of yellow on hover
          },
        //   border: '0.5px solid grey',
          padding:'7px 20px',
          boxShadow: '0px 5px 10px rgba(0, 0, 0, 0.5)', // Add shadow
        }}
      >
        New Meeting
      </Button>

      {/* Dropdown Menu */}
      <Menu
        id="meeting-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={()=>handleCreateMeeting()}>Instant Meeting</MenuItem>
        <MenuItem onClick={handleClose}>Schedule Meeting</MenuItem>
      </Menu>
    </div>
  );
}

export default MeetingDropdown;
