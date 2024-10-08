import React from "react";
import { fetchApi } from "../api/api";
import MeetingUI from "./MeetingPage";
import MeetingPage from "./MeetingPage";

export class CreateMeeting extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            message: "",
            socket: null,
            messages: [], // State to store received messages
            meetingCode:'',
        };
        this.input = React.createRef();
        this.handleInput = this.handleInput.bind(this);
    }

    async componentDidMount() {
        const meeting = await fetchApi("meetings", "GET");
        const meetingCode = meeting[0].meeting_code;
        this.setState({meetingCode:meetingCode})

        const socket = new WebSocket(`ws://localhost:8000/ws/meeting/${meetingCode}/tony/`);

        socket.onopen = (e) => {
            console.log("[open] Connection established");
        };

        socket.onmessage = (event) => {
            this.setState(prevState => ({
                messages: [...prevState.messages, event.data]
            }));
        };


        socket.onerror = (error) => {
            console.error(`[error] ${error.message}`);
        };

        // Set the socket in the state to use it later in other methods
        this.setState({ socket });
    }

    handleInput(e) {
        e.preventDefault();
        if (this.state.socket) {
            this.state.socket.send(JSON.stringify({type:'host', message: this.input.current.value }));
            this.input.current.value = ""; // Clear the input after sending the message
        }
    }

    render() {
        return (
            <div className="container-fluid">
                <form onSubmit={this.handleInput}>
                    <div className="input-group">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="enter message"
                            ref={this.input}
                        />
                        <button type="submit" className="btn btn-secondary">Send</button>
                    </div>
                </form>

                <div className="my-4">
                    <h3 className="text-center">meeting code {this.state.meetingCode}</h3>
                </div>
                {/* Display messages below the form */}
                <div className="mt-3">
                    {this.state.messages.map((msg, index) => (
                        <div key={index} className="alert alert-secondary">
                            {msg}
                        </div>
                    ))}
                </div>
                    {/* <MeetingPage/> */}
            </div>
        );
    } 
}
