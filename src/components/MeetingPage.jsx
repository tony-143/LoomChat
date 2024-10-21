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
    const [socket, setSocket] = useState(null)
    const [meetingId, setMeetingId] = useState(null)
    const [joinRequest, setJoinRequest] = useState(false)
    const [showNotification, setShowNotification] = useState(false)
    const [hostUser, setHostUser] = useState("")
    const [requestUser, setRequestUser] = useState("")
    const [render, setRender] = useState(false)
    const [userVideos, setUserVideos] = useState({})
    const navigate = useNavigate()
    const localVideoRef = useRef();
    const stream = useRef();
    let socketRef = useRef(null);
    const messageQueue = [];
    const peerConnections = {}
    let allMeetingUsers = [];
    const candidateQueue = {}; // Store ICE candidates in a queue
    let loadingMedia = '';

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

    const configuration = {
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" }  // Google's public STUN server
        ],
        iceCandidatePoolSize: 10, // Optional

    };

    // Save peerConnections and userVideos metadata to sessionStorage
    const saveStateToSession = () => {
        const peerConnectionsData = Object.keys(peerConnections).map(userName => ({
            userName,
            // You can store ICE candidates or other metadata here if necessary
        }));

        const userVideosData = Object.keys(userVideos).map(userId => ({
            userId,
            // Store stream information or any data needed to restore video
        }));

        sessionStorage.setItem('peerConnections', JSON.stringify(peerConnectionsData));
        sessionStorage.setItem('userVideos', JSON.stringify(userVideosData));
    };


    React.useEffect(() => {
        const newSocket = new WebSocket(`ws://localhost:8000/ws/meeting/${meetingcode}/${name}/`);

        setSocket(newSocket);

        const messageQueue = []; // Queue for unsent messages

        newSocket.onopen = () => {
            console.log("[open] Connection established");
            // createPeerConnection(name); // Create peer connection when WebSocket is open
            newSocket.send(JSON.stringify({ type: "new-user", message: { userName: name } }))
            // Send any queued messages
            while (messageQueue.length > 0) {
                const { type, message } = messageQueue.shift();
                sendMessage(type, message);
            }
        };

        newSocket.onerror = (e) => {
            console.log("[error] Connection error", e);
        };

        socketRef.current = newSocket;

        // Access user media and add tracks to peer connection
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(async (mediaStream) => {

                localVideoRef.current.srcObject = mediaStream;
                stream.current = mediaStream;
                loadingMedia = 'ok'
            })
            .catch(err => {
                console.log("Error accessing media devices.", err);
                setMicOn(!micOn)
                setVideo(!video)
                stream.current = new MediaStream();
            });

        // WebSocket message handling
        newSocket.onmessage = (e) => {
            const data = JSON.parse(e.data);
            // console.log("Received signaling data:", data);
            handleSignalingData(data);
        };

        return () => {
            // Send "user-removed" message before closing WebSocket
            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                sendMessage('user-removed', { userName: name });
            }

            // Close the WebSocket connection
            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                socketRef.current.close();
            }
        };
    }, [meetingcode, name]);

    // Create peer connection and set event listeners
    const createPeerConnection = async (userName) => {
        const pc = new RTCPeerConnection(configuration);
        if (userName !== name)
            setUserVideos(prevState => ({
                ...prevState,
                [userName]: new MediaStream()
            }));

        stream.current.getTracks().forEach(track => {
            pc.addTrack(track, stream.current); // Add media tracks to peer connection
        });

        pc.ontrack = (event) => {
            // Update userVideos state with new video stream
            setUserVideos(prevState => ({
                ...prevState,
                [userName]: event.streams[0] // Store the remote stream
            }));
            setRender(!render); // Trigger re-render if necessary
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                sendMessage("ice-candidate", { userName: userName, candidate: event.candidate });
            }
        };
        peerConnections[userName] = pc;
        return pc;
    };

    const waitForStream = () => {
        return new Promise((resolve, reject) => {
            const checkStream = () => {
                if (stream.current) {
                    resolve(stream.current);
                } else {
                    setTimeout(checkStream, 100); // Check again after 100ms
                }
            };
            checkStream(); // Start checking immediately
        });
    };

    const handleSignalingData = async (data) => {
        const { type, message } = data;
        const { userName } = message;
        let pc = peerConnections[userName];

        if (!stream.current) {
            await waitForStream();  // This will wait until the stream is ready
        }
        // console.log(type,micOn) 


        if (!pc) {
            pc = await createPeerConnection(userName);
        }
        // console.log(peerConnections)

        if (type === 'new-user' && name !== userName) {
            const checkingUserExist = allMeetingUsers.find(nam => { return nam === userName })
            try {
                if (!checkingUserExist) {
                    // pc = peerConnections[name];
                    allMeetingUsers.push(userName)
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    console.log('offer created by ', name)
                    sendMessage("offer", { userName: name, offer: offer, toUser: userName });
                    // console.log(allMeetingUsers)
                }
            } catch (e) { console.log(e); }
            setRender(!render); // Trigger a UI update
        }
        else if (type === 'video-state-change' && name !== userName) {
            // Handle video track being disabled/enabled
            setUserVideos(prevState => {
                const videoTrack = prevState[userName]?.getVideoTracks()[0];
                if (videoTrack) {
                    videoTrack.enabled = message.videoOn; // Enable or disable the video track based on the signal
                }
                return prevState; // Return the same state since we directly modified the track
            });
            setRender(!render); // Trigger a UI update
        }
        else if (type === 'user-removed' && name !== userName) {
            // Remove peer connection and update the userVideos state
            delete peerConnections[userName];

            // Remove the user from userVideos state
            setUserVideos(prevState => {
                const { [userName]: removedVideo, ...remainingVideos } = prevState;
                return remainingVideos; // Return the updated object without the removed user
            });

            // Remove the user from allMeetingUsers
            const updatedMeetingUsers = allMeetingUsers.filter(user => user !== userName);
            allMeetingUsers.splice(0, allMeetingUsers.length, ...updatedMeetingUsers);

            setRender(!render); // Trigger a UI update
        }

        else if (type === 'offer' && message.toUser === name) {
            if (pc.signalingState === "stable") {
                await pc.setRemoteDescription(new RTCSessionDescription(message.offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                console.log('answer created by ', name)
                sendMessage("answer", { userName: name, answer: answer, toUser: userName });
                allMeetingUsers.push(userName)

                if (candidateQueue[userName]) {
                    candidateQueue[userName].forEach(async (candidate) => {
                        try {
                            await pc.addIceCandidate(new RTCIceCandidate(candidate));
                        } catch (error) {
                            console.error("Error adding queued ICE candidate:", error);
                        }
                    });
                    candidateQueue[userName] = []; // Clear the queue
                }
            }
        } else if (type === 'answer' && message.toUser === name) {
            // console.log(peerConnections)
            // pc = peerConnections[name];
            if (pc.signalingState === "have-local-offer") {
                await pc.setRemoteDescription(new RTCSessionDescription(message.answer));
                console.log("Remote answer SDP set successfully. between", userName, name);
                setRender(!render)
                if (candidateQueue[userName]) {
                    candidateQueue[userName].forEach(async (candidate) => {
                        try {
                            await pc.addIceCandidate(new RTCIceCandidate(candidate));
                        } catch (error) {
                            console.error("Error adding queued ICE candidate:", error);
                        }
                    });
                    candidateQueue[userName] = []; // Clear the queue
                }
            }
        } else if (type === 'ice-candidate') {
            if (pc.remoteDescription && pc.remoteDescription.type) {
                await pc.addIceCandidate(new RTCIceCandidate(message['candidate']));
            } else {
                if (!candidateQueue[userName]) {
                    candidateQueue[userName] = [];
                }
                candidateQueue[userName].push(message.candidate); // Queue the candidate
            }
        }
        // setRender(!render)
    };

    // Send message through WebSocket or queue it
    const sendMessage = (type, message) => {
        if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
            // console.log(type,)
            socketRef.current.send(JSON.stringify({ type, message }));
        } else {
            // console.log("WebSocket not ready, queuing message:", { type, message });
            messageQueue.push({ type, message });
        }
    };

    const monitorAudio = (videoElement, userId) => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;

        // Create a media stream from the video element
        const source = audioContext.createMediaStreamSource(videoElement.srcObject);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkAudioLevel = () => {
            analyser.getByteFrequencyData(dataArray);
            const averageVolume = dataArray.reduce((a, b) => a + b) / dataArray.length;

            // Set the threshold for detecting when the user is speaking
            if (document.getElementsByClassName(`.video-${userId}`)) {
                if (averageVolume > 20) {  // Adjust threshold as needed
                    document.getElementsByClassName(`.video-${userId}`).style.borderColor = "green"; // User is speaking
                } else {
                    document.getElementsByClassName(`.video-${userId}`).style.borderColor = "white"; // User is not speaking
                }
            }

            requestAnimationFrame(checkAudioLevel); // Continuously monitor audio
        };

        checkAudioLevel();
    };

    const enableAudio = async () => {
        console.log('enbling audio')
        try {
            console.log(peerConnections)
            // const newStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // const newAudioTrack = newStream.getAudioTracks()[0];

            // if (stream.current) {
            //     // Replace the old audio track with the new one in the peer connection
            //     stream.current.removeTrack(stream.current.getAudioTracks()[0]);
            //     stream.current.addTrack(newAudioTrack);
            // } else {
            //     stream.current = newStream; // Set the new stream if not already set
            // }

            // // Add the new audio track to the peer connection(s)
            // Object.values(peerConnections).forEach((pc) => {
            //     pc.addTrack(newAudioTrack, stream.current);
            // });

            // sendMessage('audio-state-change', { userName: name, audioOn: true }); // Notify remote peers
        } catch (err) {
            console.error("Error accessing microphone:", err);
        }
    };

    const stopAudio = () => {
        console.log("Stopping audio")
        if (stream.current) {
            const audioTrack = stream.current.getAudioTracks()[0];
            if (audioTrack) {
                // Stop the local audio track
                // console.log(peerConnections, '--------')
                console.log(userVideos)
                audioTrack.stop();
                // Iterate through each peer connection and stop the audio track for remote users
                Object.values(peerConnections).forEach((pc) => {
                    // Get the audio sender (audio track in peer connection)
                    const audioSender = pc.getSenders().find(sender => sender.track && sender.track.kind === 'audio');

                    if (audioSender) {
                        // Replace the audio track with null (to stop audio for the remote user)
                        audioSender.replaceTrack(null);
                        console.log("Stopped audio")
                    }
                });
                // sendMessage('audio-state-change', { userName: name, audioOn: false });
            }
        }
    };

    // Function to toggle audio
    const toggleAudioStream = () => { micOn ? stopAudio() : enableAudio() };

    // Function to toggle video
    const toggleVideoStream = () => {
        if (stream.current) {
            const videoTrack = stream.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                // setVideoOn(videoTrack.enabled); // Update the videoOn state

                // Send a message to the remote peer about the video state change
                sendMessage('video-state-change', { userName: name, videoOn: videoTrack.enabled });
            }
        } else {
            console.log('plase access video')
        }
    };

    const getLocalStream = async () => {
        try {
            stream.current = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });
            localVideoRef.current.srcObject = stream.current; // Assign the stream to local video
        } catch (error) {
            console.error("Error accessing media devices:", error);
        }
    };

    const handleEndCall = () => {
        // Stop all media tracks
        if (stream.current && localVideoRef.current.srcObject) {
            localVideoRef.current.srcObject.getTracks().forEach(track => track.stop())
            localVideoRef.current = {}
            if (stream.current.getTracks())
                stream.current.getTracks().forEach(track => track.stop()); // Stop both audio and video tracks
            stream.current = null; // Clear the stream
        }

        // Notify remote peers that the user has been removed
        sendMessage('user-removed', { userName: name });

        // Remove user's video stream
        delete userVideos[name];

        console.log(peerConnections)

        Object.keys(peerConnections).forEach(user => {
            if (peerConnections[user]) {
                peerConnections[user].close(); // Close peer connection
                delete peerConnections[user]; // Remove peer connection from the object
            }
        });

        // Remove user from the allMeetingUsers array
        const updatedMeetingUsers = allMeetingUsers.filter(user => user !== name);
        // Update the allMeetingUsers array with the filtered list
        allMeetingUsers.splice(0, allMeetingUsers.length, ...updatedMeetingUsers);

        // Close the socket and navigate back to join screen
        socket.close();
        sessionStorage.setItem('userLeft', true);
        navigate(`/join/${meetingcode}/${name}`);
    };

    window.addEventListener('beforeunload', handleEndCall);
    // console.log(userVideos)

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
            <div
                className="p-4 pb-5 mb-5" // Remove horizontal padding
                style={{
                    backgroundColor: "#303030",
                    minHeight: "88vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexWrap: "wrap",
                    width: "100%",
                }}
            >
                <div className="row w-100 mx-0"> {/* Remove left-right margin */}
                    {/* Local Video */}
                    <div className={`col-12 ${Object.keys(userVideos).length === 1 ? "col-lg-6 " : "col-xl-4"} mb-4 d-flex flex-column align-items-center justify-content-center`}>
                        <video
                            id="localVideo"
                            ref={localVideoRef}
                            autoPlay
                            muted
                            playsInline
                            className="rounded w-100"
                            style={{ maxHeight: "80vh", maxWidth: '90vh', objectFit: "cover", borderWidth: '3px', borderStyle: 'solid', borderColor: 'white' }}
                        ></video>
                        <Typography variant="h6" color="white" align="center" style={{ marginTop: "10px" }}>
                            You
                        </Typography>
                    </div>

                    {/* Remote Users Videos */}
                    {Object.keys(userVideos).map((userId) => (
                        <div className="col-12 col-md-6 col-xl-4 mb-4 d-flex flex-column justify-content-center" key={userId}>
                            <video
                                id={`video-${userId}`}  // Set an ID for the video element
                                ref={(ref) => {
                                    if (ref && userVideos[userId] instanceof MediaStream) {
                                        // console.log(userVideos[userId])
                                        ref.srcObject = userVideos[userId];
                                        ref.muted = true; // Add muted if autoplay is being blocked
                                        ref.onloadedmetadata = () => {
                                            ref.play().catch((error) => {
                                                console.error(`Autoplay prevented for ${userId}:`, error);
                                            });
                                        };
                                    }
                                }}
                                autoPlay
                                playsInline
                                muted
                                className={`rounded w-100 video-${userId}`}
                                style={{
                                    maxHeight: "80vh",
                                    maxWidth: '90vh',
                                    objectFit: "cover",
                                    borderWidth: '3px',
                                    borderStyle: 'solid',
                                    borderColor: 'white',
                                }}
                            />
                            <Typography variant="h6" color="white" align="center" style={{ marginTop: "10px" }}>
                                {userId}
                            </Typography>
                        </div>
                    ))}


                </div>
            </div >



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
                }
                }
            >
                <Box className="d-none text-light mx-lg-5 align-items-center d-md-flex">

                    <Typography variant="body1">12:28 | {meetingcode}</Typography>

                </Box>

                <Box display="flex" className="mx-md-auto col-12 col-sm-5 col-xl-3 col-md-4" justifyContent="space-around" alignItems="center">

                    <IconButton onClick={() => { setMicOn(!micOn); toggleAudioStream() }} color="inherit">
                        {
                            micOn ? <MicIcon className="rounded-circle p-2" style={{ fontSize: '45px', color: "white", background: '#393939' }} /> :
                                <MicOff className="rounded-circle p-2" style={{ fontSize: '45px', color: "#062E6F", background: '#A8C7FA' }} />
                        }
                    </IconButton>

                    <IconButton onClick={() => { setVideo(!video); toggleVideoStream() }} color="inherit">
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

                    <MeetingInfoBox meetingcode={meetingcode} info={info} setInfo={setInfo} />

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

                            <MeetingInfoBox meetingcode={meetingcode} info={info} setInfo={setInfo} />

                            <ParticipantsBox joinRequest={joinRequest} meetingId={meetingId} socket={socket} name={name} meetingcode={meetingcode} participatientsbox={participatients} setParticipatientsbox={setParticipatients} />

                            <MessageBox meetingId={meetingId} requestUser={requestUser} joinRequest={joinRequest} setRequestUser={setRequestUser} setJoinRequest={setJoinRequest} message={message} socket={socket} name={name} meetingcode={meetingcode} setMessage={setMessage} />

                            <ActivitiesBox activities={activities} setActivities={setActivities} />

                            <IconButton color="secondary">
                                <LockClock className="fs-3" style={{ color: "white" }} />
                            </IconButton>

                            <KeyboardArrowDown className="fs-1" style={{ color: 'white' }} />

                        </Box>
                }

            </Paper >
        </>
    );
};

export default MeetingPage;
