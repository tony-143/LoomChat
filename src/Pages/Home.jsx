import React, { Component } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS
import { fetchApi } from '../api/api';
import { Navigate, useNavigate } from 'react-router-dom';
import MeetingDropdown from '../boxes/MeetingDropDown';
import { Button } from '@mui/material';
import Popup from '../components/MeetingPopUp';

class Home extends Component {

    constructor(props) {
        super(props);

        this.state = {
            redirect: false,
            joinpage: false,
            id:null,
            meetingCode:null,
        }
        this.joining_code = React.createRef()
        this.handleCreateMeeting = this.handleCreateMeeting.bind(this);
        this.handleJoinMeeting = this.handleJoinMeeting.bind(this);
    }

    async componentDidMount() {
        localStorage.removeItem('join_code')
        localStorage.removeItem('joined_user_name')
        sessionStorage.removeItem('userLeft')
        if (localStorage.getItem('access')) {
            const meetings = await fetchApi('meetings', 'GET')
            if (meetings) {
                console.log(meetings)
                meetings.map(async meet => {
                    const res = await fetchApi(`meetings/${meet.id}`, 'DELETE')
                    console.log(res)
                })
            }
        }
        
    }

    async handleCreateMeeting() {
        const result = await fetchApi('meetings', 'POST')
        const res = await fetchApi('getuserdetails', 'GET')
        console.log(result)
        console.log(res)
        sessionStorage.setItem('meetingId', result.id)
        this.setState({id:result.id,name:res.details.name,meetingCode:result.meeting_code, redirect: true });
    }

    async handleJoinMeeting() {

        // if (this.joining_code.current.value.length == 8) {
        // const result = await fetchApi('join', 'POST', { meeting_code: this.joining_code.current.value })
        // sessionStorage.setItem('join_code', this.joining_code.current.value)
        // this.setState({ joinpage: true })
        // }

    }

    render() {
        if (this.state.redirect) {
            return <Navigate to={`/meeting/${this.state.meetingCode}/${this.state.name}`} />
        }
        if (this.state.joinpage) {
            return <Navigate to="/joined" />
        }

        return (
            <div className="container-fluid p-0">
                <div style={{ height: '90vh' }} className="d-flex align-items-center">
                    <div className="row p-2 pe-0 w-100">
                        {/* Main Content */}
                        <div className="col-lg-6 col-12 mb-5">
                            <div className="ms-lg-5 col-12 col-sm-10 col-md-8 col-lg-9">
                                <h1 className="fs-1 text-nowrap fw-bold">Video calls and meetings</h1>
                                <h1 className="fs-1 fw-bold text-nowrap">for everyone</h1>
                                <div className="d-flex flex-column">
                                    <span className="fs-5">Connect, collaborate and celebrate from</span>
                                    <span className="fs-5 ">anywhere with Loogle Meet</span>
                                </div>
                                <div className="d-flex gap-3 mt-5 my-3">

                                    <MeetingDropdown handleCreateMeeting={this.handleCreateMeeting} />

                                    <Popup />
                                </div>


                                <hr className="mt-4 fw-bold" />
                                <a href="#" className="text-primary">
                                    Learn more about Loogle Meet
                                </a>
                            </div>
                        </div>

                        {/* Safety Message Carousel */}
                        <div className="col-lg-6 col-12 d-flex justify-content-center align-items-center">
                            <div className="home-left ms-auto">
                                <div className="d-flex justify-content-center">
                                    <div className="text-center">
                                        <img
                                            src="https://www.gstatic.com/meet/user_edu_safety_light_e04a2bbb449524ef7e49ea36d5f25b65.svg"
                                            className="d-block mx-auto rounded-circle"
                                            alt="Safety"
                                            style={{ width: '150px' }}
                                        />
                                        <h3>Your meeting is safe</h3>
                                        <p>No one can join a meeting unless invited or admitted by the host</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        );
    }
}

export default Home;
