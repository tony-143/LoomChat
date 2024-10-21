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
    InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/PersonAdd';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Chat from '@mui/icons-material/Chat';
import { Clear, Close, InterpreterMode, Search } from '@mui/icons-material';
import { fetchApi } from '../api/api';

class ParticipantsBox extends Component {
    constructor(props) {
        super(props);
        this.state = {
            searchTerm: "",
            participants: [],
            update: false,
        };
        this.handleDeclineUser = this.handleDeclineUser.bind(this);
    }

    componentDidMount() {
        if (this.props.meetingId) {
            const users = async () => {
                const result = await fetchApi(`meeting/${this.props.meetingId}`, 'GET');
                // console.log(result);
                this.setState({ participants: result });
                
            };
            users();
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.meetingId !== this.props.meetingId || prevProps.joinRequest !== this.props.joinRequest || prevState.update !== this.state.update) {
            const users = async () => {
                const result = await fetchApi(`meeting/${this.props.meetingId}`, 'GET');
                // console.log(result);
                this.setState({ participants: result });
            };
            
            users();
        }
    }



    toggleDrawer = () => {
        this.props.setParticipatientsbox(!this.props.participatientsbox)
    };


    handleSearchChange = (event) => {
        // Update the searchTerm state when user types in the input
        this.setState({ searchTerm: event.target.value });
    };

    async handleDeclineUser(name) {
        // console.log(this.props.meetingcode)
        const result = await fetchApi('join/delete', 'DELETE', { meeting_code: this.props.meetingcode, name: name })
        // console.log(result);
        this.setState({updating: !this.state.update})

    }

    async handleAcceptUser(name) {
        const result = await fetchApi('join', 'PATCH', { meeting_code: this.props.meetingcode, name: name })
        // console.log(result);
        // console.log(this.props.socket);
        this.props.socket.send(JSON.stringify({ type: 'join_approval', user: name }));
        this.props.socket.onmessage = (e) => console.log(e.data)
        this.setState({ update: !this.state.update })

    }

    clearSearch = () => {
        // Clear the search input
        this.setState({ searchTerm: "" });
    };

    render() {
        const { participants } = this.state;
        const { participatientsbox } = this.props;

        return (
            <div>
                {/* Message Box (Drawer) */}
                <Drawer
                    anchor="right"
                    open={participatientsbox}
                    onClose={this.toggleDrawer}
                    PaperProps={{
                        sx: { width: '360px', overflowY: 'hiddlen', borderRadius: '10px', margin: '15px', height: '90vh', backgroundColor: '#f4f4f4' },
                    }}
                >
                    <div className="d-flex m-2 mb-0 justify-content-between">
                        <div className="me-auto fs-5 m-2">People</div>
                        <Close className='ms-auto pointer m-2' onClick={this.toggleDrawer} />
                    </div>

                    {/* Add People Section */}
                    <div style={{ padding: '16px' }}>
                        <Button
                            variant="contained"
                            className='rounded-pill w-50 py-2'
                            startIcon={<AddIcon />}
                            fullWidth
                            sx={{
                                backgroundColor: 'skyblue',
                                color: 'black',
                                textTransform: 'none',
                            }}
                        >
                            Add people
                        </Button>
                    </div>

                    {/* Search Field */}
                    <div style={{ padding: '0 16px', height: '40px' }}>  {/* Set the desired height here */}
                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Search for people"
                            value={this.state.searchTerm}

                            onChange={this.handleSearchChange}
                            InputProps={{
                                style: { height: '40px', padding: '5px 10px' },  // Adjust the input field's height
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search />
                                    </InputAdornment>
                                ),
                                endAdornment: this.state.searchTerm && (
                                    <InputAdornment position="end">
                                        <IconButton onClick={this.clearSearch}>
                                            <Clear />
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </div>

                    <Divider />

                    {/* Participants List */}
                    <Typography variant="subtitle1" style={{ padding: '16px', textTransform: 'uppercase', fontSize: '13px' }} className="">
                        In Meeting
                    </Typography>

                    <List>
                        {Array.isArray(participants) ? participants.map((participant) => (
                            !participant.approval ? (
                                <ListItem
                                    key={participant.id}
                                    secondaryAction={
                                        <div edge="end" className="d-flex gap-2">
                                            <Button variant='contained' onClick={() => this.handleDeclineUser(participant.name)} style={{ fontSize: '10px', width: '30px' }} color='warning'>Decline</Button>
                                            <Button variant='contained' onClick={() => this.handleAcceptUser(participant.name)} style={{ fontSize: '10px', width: '30px' }} color='primary'>Accept</Button>
                                        </div>
                                    }
                                >
                                    <ListItemAvatar>
                                        <Avatar>{participant.name.charAt(0)}</Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={participant.name}
                                        secondary={participant.role}
                                    />
                                </ListItem>) : null
                        )) : null}
                    </List>
                    <List>
                        {Array.isArray(participants) ? participants.map((participant) => (
                            participant.approval ? (
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
                            ) : null
                        )) : null}
                    </List>

                </Drawer>

                {/* Button to Open/Close the Drawer */}
                <IconButton
                    onClick={this.toggleDrawer}
                    style={participatientsbox ? { position: 'relative', background: '#393939', top: '0', right: '0' } : { position: 'relative', top: '0', right: '0' }}
                >
                    <InterpreterMode className="fs-3" style={{ color: "white" }} />
                </IconButton>
            </div>
        );
    }
}

export default ParticipantsBox;
