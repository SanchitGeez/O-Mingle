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
    <div>
      <h1>Room Page</h1>
      <h4>{remoteSocketId ? "Connected " : "No one in room"}</h4>
      {/* {myStream && <button onClick={sendStreams}>Send Stream</button>} */}
      {/* {remoteSocketId && <button onClick={handleCallUser}>CALL</button>} */}
      {remoteStream && <button onClick={handleNext}>NEXT</button>}

      {myStream && (
        <>
          <h1>My Stream</h1>
          <ReactPlayer
            playing
            muted
            height="100px"
            width="200px"
            url={myStream}
          />
        </>
      )}
      {remoteStream && (
        <>
          <h1>Remote Stream</h1>
          <ReactPlayer
            playing
            muted
            height="100px"
            width="200px"
            url={remoteStream}
          />
        </>
      )}
    </div>
  );
};

export default RoomPage;
