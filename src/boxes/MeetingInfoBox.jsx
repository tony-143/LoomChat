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
import { Close, ContentCopy, Info, InterpreterMode, Message } from '@mui/icons-material';
import Notification from '../things/Notification';

class MeetingInfoBox extends Component {
    constructor(props) {
        super(props);
        this.state = {
            copied: false,
            participants: [
                { id: 1, name: 'Sai Teja (You)', role: 'Meeting host' },
            ],
        };

    }


    copyToClipboard = () => {
        const linkToCopy = "http://localhost:4000/meeting/13dde714/tej";  // Link you want to copy
        navigator.clipboard.writeText(linkToCopy)
            .then(() => {
                this.setState({ copied: !this.state.copied }); // Optional: Alert or some notification
            })
            .catch(err => {
                console.error("Failed to copy: ", err);
            });
    };

    copyToClipboardMeetingCode = () => {
        const linkToCopy = this.props.meetingcode;  // Link you want to copy
        navigator.clipboard.writeText(linkToCopy)
            .then(() => {
                this.setState({ copied: !this.state.copied }); // Optional: Alert or some notification
            })
            .catch(err => {
                console.error("Failed to copy: ", err);
            });
    };


    toggleDrawer = () => {
        this.props.setInfo(!this.props.info)
    };

    render() {
        const { participants, copied } = this.state;
        const { info,meetingcode} = this.props;

        return (
            <div>
                {/* Message Box (Drawer) */}

                <Drawer
                    anchor="right"
                    open={info}
                    onClose={this.toggleDrawer}
                    PaperProps={{
                        sx: { width: '360px', overflowY: 'hidden', borderRadius: '10px', margin: '15px', height: '90vh', backgroundColor: '#f4f4f4' },
                    }}
                >
                    <div className="d-flex m-2 mb-0 justify-content-between">
                        <div className="me-auto fs-5 m-2">Meeting Details</div>
                        <Close className='ms-auto pointer m-2' onClick={this.toggleDrawer} />
                    </div>

                    <div className="px-3 my-2 mt-4">
                        <div>Joining info</div>
                        <p className=" text-muted">{ "http://localhost:4000/"}</p>
                    </div>
                    <div className='d-flex mx-3 text-primary mb-2 gap-2 pointer text-select-none' onClick={this.copyToClipboard}>
                        <ContentCopy />
                        <p>Copy joining info</p>
                    </div>

                    <hr />
                    <div className="px-3 my-2 mt-4">
                        <div>Meeting code</div>
                        <p className=" text-muted">{meetingcode }</p>
                    </div>
                    <div className='d-flex mx-3 text-primary mb-2 gap-2 pointer text-select-none' onClick={this.copyToClipboardMeetingCode}>
                        <ContentCopy />
                        <p>Copy meeting code</p>
                    </div>

                    <hr />
                    <Divider />


                </Drawer>

                {/* Button to Open/Close the Drawer */}
                <IconButton
                    onClick={this.toggleDrawer}
                    style={info ? { position: 'relative', background: '#393939', top: '0', right: '0' } : { position: 'relative', top: '0', right: '0' }}
                >
                    <Info className="fs-3" style={{ color: "white" }} />
                </IconButton>

                {copied && <Notification message="copied link" />}
            </div>
        );
    }
}

export default MeetingInfoBox;
