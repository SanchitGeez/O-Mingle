import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketProvider";

const LobbyScreen = () => {
  const [email, setEmail] = useState("");
  const [room, setRoom] = useState("");

  const socket = useSocket();
  const navigate = useNavigate();


  const delay = (ms) => {
    return new Promise(resolve => {
      setTimeout(resolve, ms);
    });
  };

  const handleSubmitForm = useCallback(
    (e) => {
      delay(2000).then(() => {
        socket.emit("room:join", { room });

      });
      //e.preventDefault();
      
    },
    [room, socket]
  );

  const handleJoinRoom = useCallback(
    ({room}) => {
      //const { email, room } = data;
      document.title = room;
      navigate(`/room/${room}`);
    },
    [navigate]
  );

  ///create a function to wait 5 seconds to call join room and check if there is any other user apart from the one you just clicked next to

  useEffect(() => {
    handleSubmitForm();
    socket.on("room:join", handleJoinRoom);
    return () => {
      socket.off("room:join", handleJoinRoom);
    };
  }, [socket, handleJoinRoom,handleSubmitForm]);

  return (
    <div>
      <h1>Looking for a User...</h1>
    </div>
  );
};

export default LobbyScreen;
