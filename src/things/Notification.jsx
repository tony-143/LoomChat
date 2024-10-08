import React from 'react';
import { Snackbar, Alert } from '@mui/material';

class Notification extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            open: true,  // Automatically show the notification when the component is rendered
        };
    }

    handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        this.setState({ open: false });
    };

    render() {
        const { message } = this.props;  // Message passed as a prop

        return (
            <Snackbar
                open={this.state.open}
                autoHideDuration={5000}  // Automatically close after 5 seconds
                onClose={this.handleClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}  // Position at the top-center
                style={{ zIndex: 1500 }}  // Increase zIndex to ensure it is on top
            >
                <Alert
                    onClose={this.handleClose}
                    severity="info"
                    sx={{ backgroundColor: '#494949', color: '#fff' }}  // Black background with white text
                    className='rounded'
                >
                    {message}
                </Alert>
            </Snackbar>
        );
    }
}

export default Notification;
