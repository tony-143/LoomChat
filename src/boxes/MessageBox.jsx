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
    Switch,
} from '@mui/material';
import AddIcon from '@mui/icons-material/PersonAdd';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Chat from '@mui/icons-material/Chat';
import { Close, DarkMode, InterpreterMode, Message, Send } from '@mui/icons-material';
import DarkModeToggle from '../things/DarkMode';
import { Navigate } from 'react-router-dom';
import { fetchApi } from '../api/api';

class MessageBox extends Component {
    constructor(props) {
        super(props);
        this.state = {
            socket: null,
            navigate: false,
            messages: [],
        };
        this.messagesEndRef = React.createRef();
        this.inputMessageBox = React.createRef();
        this.handleMessage = this.handleMessage.bind(this);
        this.scrollToBottom = this.scrollToBottom.bind(this);
    }


    componentDidMount() {
        const messages = async () => {
            const result = await fetchApi(`messages/${this.props.meetingId}`, 'GET')
            // console.log(result)
            this.setState({ messages: result })
        }
        if (this.props.meetingId) messages()
        this.scrollToBottom();
    }

    componentDidUpdate(prevProps, prevState) {
        // console.log(prevState)

        // if (Array.isArray(prevState.messages) && Array.isArray(this.state.messages)) {
        if (prevState.messages.length !== this.state.messages.length) {
            this.scrollToBottom();
        }
        // }

        if (prevProps.meetingId !== this.props.meetingId) {
            // console.log(this.props.meetingId)

            const messages = async () => {
                const result = await fetchApi(`messages/${this.props.meetingId}`, 'GET')
                // console.log(result)
                this.setState({ messages: result })
                this.scrollToBottom()
            }
            messages()
        }

        if (prevProps.socket !== this.props.socket | prevProps.requestUser !== this.props.requestUser) {
            // console.log('ok', prevProps.meetingcode)
            if (this.props.meetingcode) {
                this.props.socket.onmessage = (e) => {
                    const data = JSON.parse(e.data)
                    // console.log(data)
                    if (data.type === "message") {
                        this.setState(prevState => ({
                            messages: [...prevState.messages, JSON.parse(e.data)]
                        }));
                        this.scrollToBottom()
                    }
                    if (data.type === "join_request") {
                        prevProps.setRequestUser(data.user);
                        prevProps.setJoinRequest((prev) => !prev);
                    }
                }

                this.props.socket.onerror = (e) => {
                    console.log("[error] Connection error", e);
                };

                this.setState({ socket: this.props.socket });
            }
        }
    }

    scrollToBottom = () => {
        const listContainer = this.messagesEndRef.current?.parentNode;
        if (listContainer) {
            listContainer.scrollTop = listContainer.scrollHeight; // Scroll directly to the bottom
        }
    };

    handleMessage(e) {
        e.preventDefault()
        const formData = new FormData(e.target);
        const formValues = Object.fromEntries(formData.entries());
        // console.log(formValues)
        const message = async (meetingId, user, message) => {
            const result = await fetchApi('messages', 'POST', {
                user: user,
                message: message,
                meeting: Number(meetingId),
            });

            // console.log(result);
        };
        if (this.inputMessageBox.current.value.trim())
            this.props.socket.send(JSON.stringify({ type: 'message', message: formValues.message }));
        
        message(this.props.meetingId, this.props.name, formValues.message );
        // console.log(this.props.name)
        this.inputMessageBox.current.value = '';
    }

    toggleDrawer = () => {
        this.props.setMessage(!this.props.message)
    };

    render() {
        const { messages } = this.state;

        const { message, navigate } = this.props;

        if (navigate) {
            return <Navigate to="/" />
        }

        return (
            <div>
                {/* Message Box (Drawer) */}
                <Drawer
                    anchor="right"
                    open={message}
                    onClose={this.toggleDrawer}
                    className=''
                    PaperProps={{
                        sx: { width: '360px', overflowY: 'hiddlen', borderRadius: '10px', margin: '15px', height: '90vh', backgroundColor: '#f4f4f4' },
                    }}
                >
                    <div className="d-flex m-2 justify-content-between">
                        <div className="me-auto fs-5 m-2">In-Call Messages</div>
                        <Close className='ms-auto pointer m-2' onClick={this.toggleDrawer} />
                    </div>

                    <div style={{ backgroundColor: '#eaeaea', fontSize: '13px' }} className="rounded rounded mx-3 px-3 mb-3 mt-3 d-flex items-center align-items-center justify-content-between" >
                        <p className="pt-3">Let everyone send messages</p>
                        <Switch checked={true} color='white' />
                    </div>
                    <div className="mx-3 text-nowrap text-center rounded pt-3" style={{ fontSize: '13px', background: '#eaeaea', lineHeight: '0.1' }}>
                        <p >Unless they're pinned, messages can only be seen by </p>
                        <p>  people in the call when the message is sent. All </p>
                        <p>   messages are deleted when the call ends.</p>
                    </div>

                    <Divider />

                    <List style={{ overflowY: 'auto' }} className="mb-5">
                        {Array.isArray(messages) ? messages.map((participant, i) => (
                            <ListItem
                                key={i}
                                secondaryAction={
                                    <IconButton edge="end">
                                        <MoreVertIcon />
                                    </IconButton>
                                }
                            >
                                <ListItemAvatar>
                                    <Avatar>{participant.user.charAt(0)}</Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={participant.user}
                                    secondary={participant.message}
                                />
                            </ListItem>
                        )) : null}
                        <div ref={this.messagesEndRef} />
                    </List>

                    <form onSubmit={(e) => this.handleMessage(e)} className='px-3 position-absolute bottom-0 w-100 mb-2 bg-light ' style={{ zIndex: '999' }}>
                        <input type="text" className="rounded-pill w-100" ref={this.inputMessageBox} name="message" style={{ backgroundColor: '#eaeaea', padding: '13px 13px', outline: 'none', border: 'none' }} placeholder="send a message" />
                        <button type='submit' className='btn position-absolute' style={{ right: '20px', top: '5px' }}> <Send style={{ color: 'grey' }} />  </button>
                    </form>


                </Drawer>

                {/* Button to Open/Close the Drawer */}
                <IconButton
                    onClick={this.toggleDrawer}
                    style={message ? { position: 'relative', background: '#393939', top: '0', right: '0' } : { position: 'relative', top: '0', right: '0' }}
                >
                    <Message className="fs-3" style={{ color: "white" }} />
                </IconButton>
            </div>
        );
    }
}

export default MessageBox;
