import React, { useEffect, useCallback, useState } from "react";
import ReactPlayer from "react-player";
import { useNavigate } from "react-router-dom";
import peer from "../service/peer";
import { useSocket } from "../context/SocketProvider";

const RoomPage = () => {
  const socket = useSocket();
  const navigate = useNavigate();
  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [myStream, setMyStream] = useState();
  const [remoteStream, setRemoteStream] = useState();

  const [called, setCalled] = useState(false);
  const handleUserJoined = useCallback(({ id }) => {
    setRemoteSocketId(id);
  }, []);


  const delay = (ms) => {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  };

  const handleCallUser = useCallback(async () => {
    console.log("handleCallUser");
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    const offer = await peer.getOffer();
    socket.emit("user:call", { to: remoteSocketId, offer });
    setMyStream(stream);
  }, [remoteSocketId, socket]);

  const handleIncommingCall = useCallback(
    async ({ from, offer }) => {
      console.log("handleIncommingCall");
      setRemoteSocketId(from);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMyStream(stream);
      console.log(`Incoming Call`, from, offer);
      const ans = await peer.getAnswer(offer);
      socket.emit("call:accepted", { to: from, ans });
    },
    [socket]
  );

  const sendStreams = useCallback(() => {
    console.log("sendStreams");
    if (myStream) {
      for (const track of myStream.getTracks()) {
        peer.peer.addTrack(track, myStream);
      }
    }else{
      console.log("myStream not set")
    }
  }, [myStream, peer]);

  const handleCallAccepted = useCallback(
    ({ from, ans }) => {
      console.log("handleCallAccepted");
      peer.setLocalDescription(ans);
      console.log("Call Accepted!");
      sendStreams();
    },
    [sendStreams]
  );

  const handleNegoNeeded = useCallback(async () => {
    console.log("handleNegoNeeded");
    const offer = await peer.getOffer();
    socket.emit("peer:nego:needed", { offer, to: remoteSocketId });
  }, [remoteSocketId, socket]);

  const handleNext = useCallback(async () => {
    //console.log("send user next to:", remoteSocketId);
    setMyStream(null);
    setRemoteStream(null);
    
    // Close the WebRTC connection
    await peer.closeConnection();
    
    // Reset remote socket ID
    setRemoteSocketId(null);
    socket.emit("user:next",{to:remoteSocketId});
    window.location.href = "/";
  }, [socket, remoteSocketId, peer,navigate]);
  
  const handlePeerNext = useCallback(async({from})=>{
    console.log("peer clicked next",from);
    window.location.href = "/";


  },[remoteSocketId,socket,navigate])

  useEffect(() => {
    if (peer.peer) {
      peer.peer.addEventListener("negotiationneeded", handleNegoNeeded);
      return () => {
        peer.peer.removeEventListener("negotiationneeded", handleNegoNeeded);
      };
    }
  }, [peer, handleNegoNeeded]);
  

  const handleNegoNeedIncomming = useCallback(
    async ({ from, offer }) => {
      console.log("handleNegoNeedIncomming");
      const ans = await peer.getAnswer(offer);
      socket.emit("peer:nego:done", { to: from, ans });
    },
    [socket,sendStreams]
  );

  const handleNegoNeedFinal = useCallback(async ({ ans }) => {
    console.log("handleNegoNeedFinal");
    await peer.setLocalDescription(ans);
  }, []);

  useEffect(() => {
    if(peer.peer){
      peer.peer.addEventListener("track", async (ev) => {
        const remoteStream = ev.streams;
        console.log("GOT TRACKS!!");
        setRemoteStream(remoteStream[0]);      
      });
    }
  }, []);

  useEffect(() => {
    if(myStream){
      delay(2000).then(() => {
        console.log("got my stream")
        sendStreams();
      });
    }
  

  }, [myStream])

  useEffect(() => {
    if(remoteSocketId){
      if(!called){
        setCalled(true);
        delay(2000).then(() => {
          console.log("called user")
          handleCallUser();
        });
      }
      
    }
  

  }, [remoteSocketId])
  


  //socket calls
  useEffect(() => {
    socket.on("user:joined", handleUserJoined);
    socket.on("incomming:call", handleIncommingCall);
    socket.on("call:accepted", handleCallAccepted);
    socket.on("peer:nego:needed", handleNegoNeedIncomming);
    socket.on("peer:nego:final", handleNegoNeedFinal);
    socket.on("peer:next",handlePeerNext);

    return () => {
      socket.off("user:joined", handleUserJoined);
      socket.off("incomming:call", handleIncommingCall);
      socket.off("call:accepted", handleCallAccepted);
      socket.off("peer:nego:needed", handleNegoNeedIncomming);
      socket.off("peer:nego:final", handleNegoNeedFinal);
      socket.off("peer:next",handlePeerNext);
    };
  }, [
    socket,
    handleUserJoined,
    handleIncommingCall,
    handleCallAccepted,
    handleNegoNeedIncomming,
    handleNegoNeedFinal,
    handlePeerNext
  ]);

  return (
    <>
<div className="back">
    <div className="green-element" style={{display:"flex"}}>
    <div className="green1">
      <p style={{opacity:"0%"}}>.</p>
    </div>
    <div className="green2">
      <p style={{opacity:"0%"}}>.</p>
    </div>
    <div style={{display:"flex",justifyContent:"end",flexDirection:"column"}}>
    <div className="green4">
      <p style={{opacity:"0%"}}>.</p>
    </div>
    <div className="green3">
      <p style={{opacity:"0%"}}>.</p>
    </div>
    </div>
    
    </div>
    <div className="purple-element" style={{display:"flex",position:"fixed",bottom:"0px",right:"-100px"}}>
    <div className="purple1">
      <p style={{opacity:"0%"}}>.</p>
    </div>
    <div className="purple2">
      <p style={{opacity:"0%"}}>.</p>
    </div>
    <div style={{display:"flex",justifyContent:"end",flexDirection:"column"}}>
    <div className="purple4">
      <p style={{opacity:"0%"}}>.</p>
    </div>
    <div className="purple3">
      <p style={{opacity:"0%"}}>.</p>
    </div>
    </div>
    
    </div>

    <div className="red-element" style={{display:"flex",position:"fixed",bottom:"0px",left:"-120px"}}>
    <div className="red1">
      <p style={{opacity:"0%"}}>.</p>
    </div>
    <div className="red2">
      <p style={{opacity:"0%"}}>.</p>
    </div>
    <div style={{display:"flex",justifyContent:"end",flexDirection:"column"}}>

    <div className="red3">
      <p style={{opacity:"0%"}}>.</p>
    </div>
    </div>
    
    </div>


    <div className="grey-element" style={{display:"flex",position:"fixed",top:"0px",right:"-50px"}}>
    <div className="grey1">
      <p style={{opacity:"0%"}}>.</p>
    </div>
    <div className="grey2">
      <p style={{opacity:"0%"}}>.</p>
    </div>
    <div className="grey3">
      <p style={{opacity:"0%"}}>.</p>
    </div>
    
    </div>
    </div>

    <div className="container">
      <div className="streams-container">
        {myStream && (
          <div className="player-wrapper">
            <ReactPlayer
              className="react-player1"
              playing
              muted
              url={myStream}
            />
          </div>
        )}
        {remoteStream && (
          <button 
            onClick={handleNext}
            className="next-button" 
          >
            NEXT
          </button>
        )}
        {remoteStream && (
          <div className="player-wrapper">
            <ReactPlayer
              className="react-player2"
              playing
              muted
              url={remoteStream}
            />
          </div>
        )}
      </div>
    </div>
    </>
    
  );
  
  
}
export default RoomPage;
