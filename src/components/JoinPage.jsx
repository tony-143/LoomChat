import React from "react";
import { fetchApi } from "../api/api";
import { Navigate } from "react-router-dom";
import { Button, Rating } from "@mui/material";
import { RateReview, Security, WidthFull } from "@mui/icons-material";

export class JoinPage extends React.Component {

    constructor(props) {
        super(props); 
        this.state = {
            messages: [],
            socket: null,
            name: localStorage.getItem('joined_user_name'),
            navigate: false,
            meetingCode: null,
            name: null,
            socket: null,
            error: false,
            navigateHome: false,
            ratingValue: 0,
            rejoin: false,
            userLeft: sessionStorage.getItem('userLeft') || false,
        }
        this.input = React.createRef()
        this.handleHomeBtn = this.handleHomeBtn.bind(this)
        this.handleRatingChange = this.handleRatingChange.bind(this)
        this.handleAskJoinBtn = this.handleAskJoinBtn.bind(this)
        this.handleRejoinBtn = this.handleRejoinBtn.bind(this)
    }

    componentDidMount() {
        const pathname = window.location.pathname;
        const pathParts = pathname.split('/');
        const meetingCode = pathParts[2];
        const name = pathParts[3];
        const socket = new WebSocket(`ws://localhost:8000/ws/meeting/${meetingCode}/${name}/`);
        socket.onopen = (e) => { console.log("conection on"); }
        socket.onerror = (e) => {
            console.log("error", e)
            this.setState({ error: true, userLeft: false });
        }

        socket.onmessage = (e) => {
            // console.log(e.data)
            const data = JSON.parse(e.data)

            if (data.type === "join_approved") {
                alert("Join approved")
                this.setState({ navigate: !this.state.navigate })
            }
        }
        this.setState({ socket: socket, meetingCode: meetingCode, name: name });
    }

    componentWillUnmount() {
        // console.log(nextProps)
        if(this.state.socket ) {
            this.state.socket.close();
        }
    }

    handleAskJoinBtn() {
        // console.log(this.state.socket)
        this.state.socket.send(JSON.stringify({ type: 'join_request' }))
    }

    handleRejoinBtn() {
        sessionStorage.setItem('userLeft',false)
        this.setState({ rejoin: true, error: false, userLeft: !this.state.userLeft });
    }

    handleHomeBtn() {
        this.setState({ navigateHome: true })
    }

    handleJoinBtn(){
        this.state.socket.close()
        this.setState({ navigate: !this.state.navigate })
    }

    async handleRatingChange(event, newValue) {
        this.setState({ ratingValue: newValue });
        const ans =await fetchApi('rating','POST',{name:this.state.name,rating:newValue})
        if(ans.success){
            alert('thankyou for submitting')
            this.setState({ navigateHome: true });
        }
    }

    render() {

        const { navigate, name, userLeft, rejoin, ratingValue, navigateHome, error, meetingCode } = this.state

        if (navigate) {
            return <Navigate to={`/meeting/${meetingCode}/${name}`} />
        }

        if (navigateHome) return <Navigate to="/" />

        return (
            <div className="container overflow-hidden " >

                {
                    !error && !userLeft ?
                        <div className="d-flex gap-5 flex-wrap align-items-center justify-content-center" style={{ height: '90vh' }}>
                            <div className="col-12 col-lg-6">
                                <div style={{ minWidth: '400px', height: '400px' }} className="rounded bg-dark p-2 mx-auto">

                                </div>
                            </div>
                            <div className=" text-center">
                                <div className="fs-2">Ready to join?</div>
                                {
                                    !rejoin ?
                                        <Button variant="contained" onClick={() => this.handleAskJoinBtn()} className="rounded-pill p-5 py-3 mt-3 mb-4" >Ask to Join</Button> :
                                        <Button variant="contained" onClick={() => this.handleJoinBtn()} className="rounded-pill p-5 py-3 mt-3 mb-4" >Join</Button>
                                }

                                {/* <div className="d-flex gap-2 flex-column">
                            <p>Present</p>
                            <p>Ask to use Companion Mode</p>
                            <p>Show fewer options</p>
                        </div> */}
                            </div>
                        </div>
                        :
                        <>
                            {
                                !userLeft ?

                                    <div className="d-flex gap-3 text-center flex-column justify-content-center align-items-center mt-5" >
                                        <h1>Check your meeting code</h1>

                                        <div>
                                            <p>Make sure that you've entered the correct meeting code in the URL, e.g.</p>
                                            <p>https://loom.com/xxxx-yyyy <span className="text-primary">Learn more</span></p>
                                        </div>
                                        <Button onClick={() => this.handleHomeBtn()} variant="contained" color="primary" >Return to home screen</Button>
                                        <a >Submit feedback</a>

                                        <div>
                                            <div className="mt-5 mx-auto">
                                                <div className="d-flex text-left border gap-2">
                                                    <img src="" alt="" />
                                                    <div className="">
                                                        <h4>Your meeting is safe</h4>
                                                        <p>No one can join a meeting unless invited or admitted by the host</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    :
                                    <div className="d-flex gap-3 text-center flex-column justify-content-center align-items-center mt-5" >
                                        <h1 className="fs-1">You left the meeting</h1>

                                        <div className="d-flex gap-3 text-center mb-4 justify-content-center">
                                            <Button onClick={() => this.handleRejoinBtn()} variant="outlined" color="primary" >Rejoin</Button>
                                            <Button onClick={() => this.handleHomeBtn()} variant="contained" color="primary" >Return to home screen</Button>
                                        </div>

                                        <div className="shadow d-flex p-3 rounded flex-column mt-4">
                                            <h5>How was the audio and video?</h5>
                                            <div className="w-100">
                                                <Rating
                                                    className="mx-auto"
                                                    sx={{
                                                        fontSize: '3rem',  // Adjust star size
                                                        '& > *': {
                                                            marginRight: '10px',  // Adjust space between stars
                                                            marginLeft: '10px',  // Adjust space between stars
                                                        },
                                                    }}
                                                    name="feedback-rating"
                                                    value={ratingValue}
                                                    onChange={this.handleRatingChange}
                                                    precision={0.5} // allows half-star rating, adjust as needed
                                                />
                                            </div>
                                            <div className="d-flex mx-2 justify-content-between">
                                                <p className="text-muted">Very bad</p>
                                                <p className="text-muted">Very good</p>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="mt-5 mx-auto">
                                                <div className="d-flex border-secondary shadow rounded px-2 text-left py-4 align-items-center border gap-4">
                                                    <img src="" alt="" />
                                                    <Security className="fs-1" />
                                                    <div className="text-left w-100 d-flex flex-column">
                                                        <h4 className="me-auto" > Your meeting is safe</h4>
                                                        <p className="me-auto text-left"  >No one can join a meeting unless invited or admitted by the host</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                            }
                        </>
                }
            </div>

        )
    }

}