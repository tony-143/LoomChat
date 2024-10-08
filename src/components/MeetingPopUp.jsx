import React from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { fetchApi } from '../api/api';
import { Navigate } from 'react-router-dom';

class Popup extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: false,
            name: '',
            meetingCode: '',
            errorMessage: '',
            nameErrorMessage: '',
            error: false,
            navigate: false
        };
        this.handleClickOpen = this.handleClickOpen.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.validateMeetingCode = this.validateMeetingCode.bind(this);
    }

    // Open the dialog
    handleClickOpen() {
        this.setState({ open: true });
    }

    // Close the dialog
    handleClose() {
        this.setState({ open: false });
    }

    // Handle form input changes
    handleChange(event) {
        const { name, value } = event.target;
        this.setState({ [name]: value });
    }

    validateMeetingCode() {
        const { meetingCode, name } = this.state;
        if (!name.trim()) {
            this.setState({
                error: true,
                nameErrorMessage: 'Name must be required!'
            })
            return false;
        }
        if (!meetingCode) {
            this.setState({
                error: true,
                errorMessage: 'Meeting code is required!',
                nameErrorMessage:''
            });
            return false;
        }
        if (meetingCode.length < 8) {
            this.setState({
                ...this.state,
                error: true,
                errorMessage: 'Meeting code must be at least 8 characters long!',
            });
            return false;
        }
        this.setState({ error: false, errorMessage: '' });
        return true;
    }


    // Submit form
    async handleSubmit() {
        const { name, meetingCode } = this.state;

        if (this.validateMeetingCode()) {
            // console.log(name + '', meetingCode);
            const result = await fetchApi('join', 'POST', { name: name, meeting_code: meetingCode })
            if (result.error) {
                this.setState({
                    error: true,
                    errorMessage: result.error.detail ,
                    nameErrorMessage: result.error ? result.error.error : ''
                })
                console.log(result)
            }
            else {
                console.log(result)
                this.setState({
                    navigate:true
                })
                this.handleClose();
            }

        }


    }

    render() {
        const { open, name, error, nameErrorMessage, meetingCode, navigate, errorMessage } = this.state;

        if (navigate) {
            return <Navigate to={`/join/${meetingCode}/${name}`}/>
        }

        return (
            <div>
                {/* Button to open the form popup */}
                <Button variant='contained' sx={{
                    backgroundColor: 'white',
                    color: 'black',
                    '&:hover': {
                        backgroundColor: '#6C757D',
                        color: 'white'
                    },
                    border: '0.5px solid grey',
                    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.3)',
                }} onClick={this.handleClickOpen}>
                    Join Meeting
                </Button>

                {/* Dialog popup for form */}
                <Dialog open={open} onClose={this.handleClose}>
                    <DialogTitle>Join Meeting</DialogTitle>
                    <DialogContent>
                        {/* Input fields */}
                        <TextField
                            autoFocus
                            margin="dense"
                            name="name"
                            label="Name"
                            type="text"
                            fullWidth
                            variant="outlined"
                            value={name}
                            error={error}
                            onChange={this.handleChange}
                            helperText={error ? nameErrorMessage : ''}
                        />
                        <TextField
                            margin="dense"
                            name="meetingCode"
                            label="Enter a meeting code"
                            type="text"
                            fullWidth
                            variant="outlined"
                            value={meetingCode}
                            onChange={this.handleChange}
                            error={error} // Conditionally apply error
                            helperText={error ? errorMessage : ''} // Show error message if error exists
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.handleClose} sx={{ border: '0.1px solid grey', fontWeight: 'bold' }} variant="contained" color="light">
                            Cancel
                        </Button>
                        <Button onClick={this.handleSubmit} variant="contained" color="primary" sx={{ border: '0.1px solid yellow', fontWeight: 'bold' }} >
                            Join
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        );
    }
}

export default Popup;
