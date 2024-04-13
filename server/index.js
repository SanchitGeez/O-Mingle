const { Server } = require("socket.io");
const { v4: uuidv4 } = require('uuid');

const io = new Server(8000, {
  cors: true,
});

const rooms = [];

io.on("connection", (socket) => {
  console.log(`Socket Connected`, socket.id);
  socket.on("room:join", (data) => {
    //const { email } = data;
    let room = data.room;
    if(rooms.length==0){
      room = uuidv4();
      rooms.push(room);
    }else{
      if(rooms[1]){
        room = rooms[1];
      }else{
        room = rooms[0];
      }

      rooms.pop();
    }
    io.to(room).emit("user:joined", { id: socket.id });
    socket.join(room);
    io.to(socket.id).emit("room:join", {room});
  });

  socket.on("user:call", ({ to, offer }) => {
    io.to(to).emit("incomming:call", { from: socket.id, offer });
  });

  socket.on("call:accepted", ({ to, ans }) => {
    io.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    //console.log("peer:nego:needed", offer);
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    //console.log("peer:nego:done", ans);
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });

  socket.on("user:next",({to})=>{
    console.log("user cllicked next:",socket.id);
    console.log("opposite of clicker",to);
    io.to(to).emit("peer:next",{from:socket.id});
  })
});
