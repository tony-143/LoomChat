import React, { useEffect, useState } from 'react';
// import { JitsiMeetJS } from 'lib-jitsi-meet';

const JitsiMeetingCustom = ({ meetingId }) => {
    const [localStream, setLocalStream] = useState(null);
    const [remoteStreams, setRemoteStreams] = useState([]);
    const localVideoRef = useRef();
    const userVideos = useRef({});
    const messageQueue = [];
    const peerConnections = {}
    let userOffer = null;
    const candidateQueue = {}; // Store ICE candidates in a queue

    React.useEffect(() => {
        // Access user media and add tracks to peer connection
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(async (mediaStream) => {
                let pc = peerConnections[name];
                if (!pc) {
                    pc = await createPeerConnection(name);
                }
                localVideoRef.current.srcObject = mediaStream;
                mediaStream.getTracks().forEach(track => {
                    pc.addTrack(track, mediaStream); // Add media tracks to peer connection
                });
                userVideos[name] = mediaStream;
                createOffer(name); // Create offer after adding tracks
            })
            .catch(err => console.log("Error accessing media devices.", err));

        // WebSocket message handling
        newSocket.onmessage = (e) => {
            const data = JSON.parse(e.data);
            // console.log("Received signaling data:", data);
            handleSignalingData(data);
        };
    }, []);



    // Create peer connection and set event listeners
    const createPeerConnection = async (name) => {
        const pc = new RTCPeerConnection(configuration);

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                // console.log("Sending ICE candidate", event.candidate); // Log ICE candidate
                sendMessage("ice-candidate", { name: name, candidate: event.candidate });
            }
        };
        pc.ontrack = (event) => {
            // Handle remote track and assign to the user's video element
            if (!userVideos.current[name]) {
                userVideos.current[name] = new MediaStream();
            }
            userVideos.current[name].addTrack(event.track);
            // userVideos.current[name].srcObject = event.streams[0];
            setRender(!render)
        };

        peerConnections[name] = pc;
        return pc;
    };

    // Handle received signaling data (offer, answer, candidate)
    const handleSignalingData = async (data) => {
        const { type, message } = data;
        const { name } = message;
        let pc = peerConnections[name];
        console.log(type)
        if (!pc) {
            pc = await createPeerConnection(name);
        }

        if (type === 'offer') {
            if (pc.signalingState === "stable") {
                await pc.setRemoteDescription(new RTCSessionDescription(message.offer));
                createAnswer(name); // Create an answer after setting remote offer
                if (candidateQueue[name]) {
                    candidateQueue[name].forEach(async (candidate) => {
                        try {
                            await pc.addIceCandidate(new RTCIceCandidate(candidate));
                            console.log("Queued ICE candidate added successfully.");
                        } catch (error) {
                            console.error("Error adding queued ICE candidate:", error);
                        }
                    });
                    candidateQueue[name] = []; // Clear the queue
                }
            }
        } else if (type === 'answer') {
            if (pc.signalingState === "have-local-offer") {
                await pc.setRemoteDescription(new RTCSessionDescription(message.answer));
                console.log("Remote answer SDP set successfully.");
                if (candidateQueue[name]) {
                    candidateQueue[name].forEach(async (candidate) => {
                        try {
                            await pc.addIceCandidate(new RTCIceCandidate(candidate));
                            console.log("Queued ICE candidate added successfully.");
                        } catch (error) {
                            console.error("Error adding queued ICE candidate:", error);
                        }
                    });
                    candidateQueue[name] = []; // Clear the queue
                }
            }
        } else if (type === 'ice-candidate') {
            // console.log("Adding ICE candidate:", message['candidate']);
            // if(userOffer) sendMessage('offer', { name: name, offer : userOffer})
            if (pc.remoteDescription && pc.remoteDescription.type) {
                await pc.addIceCandidate(new RTCIceCandidate(message['candidate']));
            } else {
                // console.log("Remote description not set, queuing ICE candidate.");
                if (!candidateQueue[name]) {
                    candidateQueue[name] = [];
                }
                candidateQueue[name].push(message.candidate); // Queue the candidate
            }
        }
    };
    console.log(userVideos.current)

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

    // Create SDP offer
    const createOffer = async (name) => {
        let pc = peerConnections[name];
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        console.log('offer created')
        userOffer = offer
        sendMessage("offer", { name: name, offer: offer });
    };

    // Create SDP answer
    const createAnswer = async (name) => {
        let pc = peerConnections[name];
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log('answer created')
        sendMessage("answer", { name: name, answer: answer });
    };

    return (
        <div>
            <video id="localVideo" ref={localVideoRef} playsInline autoPlay muted
                        style={{ width: '300px', height: '200px', margin: '10px' }} // Add some styles for layout
                    ></video>
                    {Object.keys(userVideos.current).map((userId) => (
                        <video
                            key={userId}
                            ref={(ref) => {
                                if (ref && userVideos.current[userId] && userVideos.current[userId].srcObject) {
                                    ref.srcObject = userVideos.current[userId].srcObject; // Assign video stream to the video element
                                }
                            }}
                            autoPlay
                            playsInline
                            style={{ width: '300px', height: '200px', margin: '10px' }} // Add some styles for layout
                        />
                    ))}
        </div>
    );
};

export default JitsiMeetingCustom;
