import React, { Component } from 'react';
import {
    Drawer,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    IconButton,
    TextField,
    Typography,
    Avatar,
    Divider,
    Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/PersonAdd';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Chat from '@mui/icons-material/Chat';
import { Close, Info, InterpreterMode, LocalActivity, Message } from '@mui/icons-material';

class ActivitiesBox extends Component {
    constructor(props) {
        super(props);
        this.state = {
            
            participants: [
                { id: 1, name: 'Sai Teja (You)', role: 'Meeting host' },
            ],
        };

    }

    toggleDrawer = () => {
        this.props.setActivities(!this.props.activities)
    };

    render() {
        const { participants } = this.state;
        const {activities} = this.props;

        return (
            <div>
                {/* Message Box (Drawer) */}
                <Drawer
                    anchor="right"
                    open={activities}
                    onClose={this.toggleDrawer}
                    PaperProps={{
                        sx: { width: '360px',overflowY:'hiddlen', borderRadius: '10px', margin: '15px', height: '90vh', backgroundColor: '#f4f4f4' },
                    }}
                >
                    <Close className='ms-auto m-2' onClick={this.toggleDrawer}/>
                    {/* Add People Section */}
                    <div style={{ padding: '16px' }}>
                        <Button
                            variant="outlined"
                            startIcon={<AddIcon />}
                            fullWidth
                            sx={{
                                backgroundColor: 'white',
                                color: 'black',
                                textTransform: 'none',
                            }}
                        >
                            Activites
                        </Button>
                    </div>

                    {/* Search Field */}
                    <div style={{ padding: '0 16px' }}>
                        <TextField
                            placeholder="Search for people"
                            fullWidth
                            variant="outlined"
                            sx={{ backgroundColor: 'white', marginBottom: '16px' }}
                        />
                    </div>

                    <Divider />

                    {/* Participants List */}
                    <Typography variant="subtitle1" style={{ padding: '16px' }}>
                        In Meeting
                    </Typography>

                    <List>
                        {participants.map((participant) => (
                            <ListItem
                                key={participant.id}
                                secondaryAction={
                                    <IconButton edge="end">
                                        <MoreVertIcon />
                                    </IconButton>
                                }
                            >
                                <ListItemAvatar>
                                    <Avatar>{participant.name.charAt(0)}</Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={participant.name}
                                    secondary={participant.role}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Drawer>

                {/* Button to Open/Close the Drawer */}
                <IconButton
                    onClick={this.toggleDrawer}
                    style={ activities? { position: 'relative',background:'#393939', top: '0', right: '0' }:{ position: 'relative', top: '0', right: '0' }}
                >
                    <LocalActivity className="fs-3" style={{ color: "white" }} />
                </IconButton>
            </div>
        );
    }
}

export default ActivitiesBox;
