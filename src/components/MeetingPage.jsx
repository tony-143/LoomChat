import React, { useEffect, useRef, useState } from "react";
import {
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Grid,
    Avatar,
    Container,
    Box,
    Paper,
} from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import VideocamIcon from "@mui/icons-material/Videocam";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import CallEndIcon from "@mui/icons-material/CallEnd";
import ChatIcon from "@mui/icons-material/Chat";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { AlignHorizontalCenter, BackHand, BackHandOutlined, Handshake, Info, InterpreterMode, KeyboardArrowDown, KeyboardArrowUpRounded, KeyboardArrowUpSharp, LockClock, MicNone, MicOff, VideocamOff } from "@mui/icons-material";
import MeetMenu from "./MeetMenu";

import ParticipantsBox from "../boxes/ParticipatientsBox";
import MessageBox from "../boxes/MessageBox";
import MeetingInfoBox from "../boxes/MeetingInfoBox";
import ActivitiesBox from "../boxes/ActivitisBox";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { fetchApi } from "../api/api";
import { v4 as uuidv4 } from 'uuid';
import Notification from "../things/Notification";
import Peer from 'simple-peer';
import kurentoUtils from 'kurento-utils';

const MeetingPage = () => {
    const [micOn, setMicOn] = useState(true)
    const [video, setVideo] = useState(true)
    const [handRise, setHandRise] = useState(false)
    const [info, setInfo] = useState(false)
    const [activities, setActivities] = useState(false)
    const [message, setMessage] = useState(false)
    const [participatients, setParticipatients] = useState(false)
    const [shareScreen, setShareScreen] = useState(false)
    const [menu, setMenu] = useState(false)
    const { meetingcode, name } = useParams();
    const [endCall, setEndCall] = useState(false)
    const [socket, setSocket] = useState(null)
    const [meetingId, setMeetingId] = useState(null)
    const [joinRequest, setJoinRequest] = useState(false)
    const [showNotification, setShowNotification] = useState(false)
    const [hostUser, setHostUser] = useState("")
    const [requestUser, setRequestUser] = useState("")
    const [peers, setPeers] = useState([]);
    const [stream, setStream] = useState(null)
    const [webRtcPeer, setWebRtcPeer] = useState(null); 
    const userId = useRef(uuidv4())
    const navigate = useNavigate()
    const localVideoRef = useRef();
    const userVideos = useRef({});

    React.useEffect(() => {
        const fetchData = async () => {
            const res = await fetchApi('check', 'POST', { meeting_code: meetingcode, name });
            if (res.error) {
                if (res.error['errorN']) navigate('/');
                else navigate(`/join/${meetingcode}/${name}`);
            }
            const result = await fetchApi('meeting/id', 'POST', { meeting_code: meetingcode });
            setMeetingId(result.success[0]);
            setHostUser(result.success[1]);
        };

        fetchData();
    }, [meetingId, meetingcode, name, navigate]);

    React.useEffect(() => {
        if (joinRequest || requestUser) {
            setShowNotification(true);
        }
    }, [joinRequest, requestUser]);

    React.useEffect(() => {
        const newSocket = new WebSocket(`ws://localhost:8000/ws/meeting/${meetingcode}/${name}/`);

        setSocket(newSocket);

        newSocket.onopen = () => {
            console.log("[open] Connection established");
        };

        newSocket.onerror = (e) => {
            console.log("[error] Connection error", e);
        };

        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then((mediaStream) => {
                // Store and set up the local user's stream
                setStream(mediaStream);
                localVideoRef.current.srcObject = mediaStream;

            })
            .catch(err => console.log("Error accessing media devices.", err));

        newSocket.onmessage = async (e) => {
            const data = JSON.parse(e.data);
            console.log(data);
            handleWebSocketMessage(message);
            // const message = JSON.parse(e.data);
            // if (message.type === 'offer') {
            //     await handleReceiveOffer(message.data, message.from);
            // } else if (message.type === 'answer') {
            //     await handleReceiveAnswer(message.data, message.from);
            // } else if (message.type === 'candidate') {
            //     handleNewICECandidate(message.candidate, message.from);
            // } else if (message.type === 'users') {
            //     // When a new user joins, create a peer connection with each existing user
            //     message.users.forEach((userId) => createPeerConnection(userId));
            // }
        };

    createWebRtcPeer(true , userId.current)

        // return () => socket.close();

    }, [meetingcode, name]);

    // Function to create a Kurento WebRTC Peer for video streaming
    const createWebRtcPeer = (isInitiator, userId) => {
        const options = {
            localVideo: localVideoRef.current,  // Your local video stream
            remoteVideo: remoteVideoRefs.current[userId],  // Remote user's video
            onicecandidate: (candidate) => sendIceCandidate(candidate, userId),  // ICE candidate handler
            mediaConstraints: { video: true, audio: true }
        };

        // If initiator, create an offer, otherwise answer the incoming offer
        const peer = isInitiator
            ? kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options, (error) => {
                if (error) return console.error(error);
                peer.generateOffer((error, offerSdp) => {
                    if (error) return console.error(error);
                    sendOffer(offerSdp, userId);  // Send offer to WebSocket
                });
            })
            : kurentoUtils.WebRtcPeer.WebRtcPeerSendrecv(options, async (error) => {
                if (error) return console.error(error);
            });

        setWebRtcPeer(peer);  // Store WebRTC peer
    };

    // Send WebRTC offer to other participants via WebSocket
    const sendOffer = (offerSdp, userId) => {
        const message = {
            type: "offer",
            sdp: offerSdp,
            to: userId
        };
        socket.current.send(JSON.stringify(message));
    };

    // Handle the incoming messages from WebSocket
    const handleWebSocketMessage = (message) => {
        switch (message.type) {
            case 'offer':
                handleReceiveOffer(message.sdp, message.from);
                break;
            case 'answer':
                handleReceiveAnswer(message.sdp, message.from);
                break;
            case 'candidate':
                handleNewICECandidate(message.candidate, message.from);
                break;
            default:
                break;
        }
    };

    // Handle receiving an offer from another user
    const handleReceiveOffer = async (offerSdp, userId) => {
        createWebRtcPeer(false, userId);  // Create peer connection for non-initiator
        const desc = new RTCSessionDescription(offerSdp);
        await webRtcPeer.current.setRemoteDescription(desc);
        const answerSdp = await webRtcPeer.current.createAnswer();
        await webRtcPeer.current.setLocalDescription(answerSdp);

        socket.current.send(JSON.stringify({
            type: "answer",
            sdp: answerSdp,
            to: userId
        }));
    };

    // Handle receiving an answer from another user
    const handleReceiveAnswer = async (answerSdp, userId) => {
        const desc = new RTCSessionDescription(answerSdp);
        await webRtcPeer.current.setRemoteDescription(desc);
    };

    // Handle ICE candidates from other participants
    const handleNewICECandidate = (candidate, userId) => {
        const iceCandidate = new RTCIceCandidate(candidate);
        webRtcPeer.current.addIceCandidate(iceCandidate);
    };

    // Send ICE candidate via WebSocket
    const sendIceCandidate = (candidate, userId) => {
        socket.current.send(JSON.stringify({
            type: "candidate",
            candidate,
            to: userId
        }));
    };


    const handleEndCall = () => {
        if (name === hostUser) {
            socket.close();
            sessionStorage.setItem('userLeft', true);
            navigate(`/join/${meetingcode}/${name}`);
        } else {
            socket.close();
            sessionStorage.setItem('userLeft', true);
            navigate(`/join/${meetingcode}/${name}`);
        }
    };

    return (
        <>
            {showNotification && <Notification message={`${requestUser} sent a join request `} />}
            {/* Top App Bar */}
            <AppBar position="static" style={{ backgroundColor: "#202124" }}>
                <Toolbar>
                    <Typography variant="h6" style={{ flexGrow: 1 }}>
                        Hosted by {hostUser}
                    </Typography>
                    <Typography variant="body1">12:28 | {meetingcode.match(/.{1,4}/g).join(' - ')}</Typography>
                    <IconButton edge="end" color="inherit">
                        <MoreVertIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>

            {/* Main Meeting Area */}
            <Container
                maxWidth=""
                style={{
                    height: "88vh",
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#303030",
                }}
            >
                <Grid container alignItems="center" justifyContent="center">
                    <Avatar
                        style={{
                            width: 150,
                            height: 150,
                            backgroundColor: "#6a1b9a",
                            fontSize: "48px",
                        }}
                    >
                        S
                    </Avatar>

                    <video id="localVideo" ref={localVideoRef} autoPlay muted></video>
                    {Object.keys(userVideos.current).map((userId) => (
                        <video key={userId} ref={(ref) => { userVideos.current[userId] = ref; }} autoPlay />
                    ))}
                    <Typography variant="h6" color="white" align="center" style={{ marginTop: "20px" }}>
                        Sai Teja
                    </Typography>
                </Grid>
            </Container>

            {/* Bottom Control Bar */}
            <Paper
                square
                elevation={3}
                style={{
                    padding: "10px",
                    position: "fixed",
                    bottom: 0,
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    backgroundColor: "#202124",
                }}
            >
                <Box className="d-none text-light mx-lg-5 align-items-center d-md-flex">

                    <Typography variant="body1">12:28 | {meetingcode}</Typography>

                </Box>

                <Box display="flex" className="mx-md-auto col-12 col-sm-5 col-xl-3 col-md-4" justifyContent="space-around" alignItems="center">

                    <IconButton onClick={() => setMicOn(!micOn)} color="inherit">
                        {
                            micOn ? <MicIcon className="rounded-circle p-2" style={{ fontSize: '45px', color: "white", background: '#393939' }} /> :
                                <MicOff className="rounded-circle p-2" style={{ fontSize: '45px', color: "#062E6F", background: '#A8C7FA' }} />
                        }
                    </IconButton>

                    <IconButton onClick={() => setVideo(!video)} color="inherit">
                        {
                            video ? <VideocamIcon className="rounded-circle p-2" style={{ fontSize: '45px', color: "white", background: '#393939' }} /> :
                                <VideocamOff className=" rounded-circle p-2" style={{ fontSize: '45px', color: "#062E6F", background: '#A8C7FA' }} />
                        }
                    </IconButton>


                    <IconButton onClick={() => setShareScreen(!shareScreen)} color="inherit">
                        {
                            !shareScreen ? <ScreenShareIcon className="rounded-circle p-2" style={{ fontSize: '45px', color: "white", background: '#393939' }} /> :
                                <ScreenShareIcon className=" rounded-circle p-2" style={{ fontSize: '45px', color: "#062E6F", background: '#A8C7FA' }} />
                        }
                    </IconButton>

                    <IconButton onClick={() => setHandRise(!handRise)} color="inherit">
                        {
                            !handRise ? <BackHand className="rounded-circle p-2" style={{ fontSize: '45px', color: "#062E6F", background: '#A8C7FA' }} /> :
                                <BackHandOutlined className="rounded-circle p-2" style={{ fontSize: '45px', color: "white", background: '#393939' }} />
                        }
                    </IconButton>

                    <MeetMenu />

                    <IconButton onClick={() => handleEndCall()} color="secondary">
                        <CallEndIcon className="rounded-pill ms-2 me-5 px-2 " style={{ fontSize: '45px', color: "white", backgroundColor: "red" }} />
                    </IconButton>

                </Box>

                <Box className="d-sm-flex  d-none gap-1 ms-5 ps-5" display="flex" justifyContent="center" alignItems="center">

                    <MeetingInfoBox info={info} setInfo={setInfo} />

                    <ParticipantsBox joinRequest={joinRequest} meetingId={meetingId} socket={socket} name={name} meetingcode={meetingcode} participatientsbox={participatients} setParticipatientsbox={setParticipatients} />

                    <MessageBox meetingId={meetingId} requestUser={requestUser} joinRequest={joinRequest} setRequestUser={setRequestUser} setJoinRequest={setJoinRequest} name={name} socket={socket} meetingcode={meetingcode} message={message} setMessage={setMessage} />

                    <ActivitiesBox activities={activities} setActivities={setActivities} />

                    <IconButton color="secondary">
                        <LockClock className="fs-3" style={{ color: "white" }} />
                    </IconButton>

                </Box>

                {
                    !menu ?
                        <KeyboardArrowUpRounded onClick={() => setMenu(true)} style={{ zIndex: 999, right: 0, bottom: 3 }} className="d-sm-none fs-1 text-light position-absolute rounded-pill mb-3 me-3 " /> :

                        <Box onClick={() => { setMenu(false) }} className="d-sm-none position-absolute bg-dark rounded-pill  p-2 mb-2" left="" bottom="0" right="0" zIndex={999} display="flex" justifyContent="center" flexDirection="column" alignItems="center">

                            <MeetingInfoBox info={info} setInfo={setInfo} />

                            <ParticipantsBox joinRequest={joinRequest} meetingId={meetingId} socket={socket} name={name} meetingcode={meetingcode} participatientsbox={participatients} setParticipatientsbox={setParticipatients} />

                            <MessageBox meetingId={meetingId} requestUser={requestUser} joinRequest={joinRequest} setRequestUser={setRequestUser} setJoinRequest={setJoinRequest} message={message} socket={socket} name={name} meetingcode={meetingcode} setMessage={setMessage} />

                            <ActivitiesBox activities={activities} setActivities={setActivities} />

                            <IconButton color="secondary">
                                <LockClock className="fs-3" style={{ color: "white" }} />
                            </IconButton>

                            <KeyboardArrowDown className="fs-1" style={{ color: 'white' }} />

                        </Box>
                }



            </Paper>
        </>
    );
};

export default MeetingPage;
