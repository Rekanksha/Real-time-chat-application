const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const dotenv = require("dotenv");
const cors = require('cors');
const path=require('path');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./users');
const router = require('./router');

require('dotenv').config();
console.log("ENV?", process.env.NODE_ENV);

const app = express();
const server = http.createServer(app);

const io = socketio(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(cors());

//---------DEPLOYMENT-------
const __dirname1 = path.resolve();

if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname1, '../client/build');
  app.use(express.static(buildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
} else {
  app.get("/", (req, res) => {
    res.send("API is running..");
  });
}
//---------DEPLOYMENT-------

app.use(router);
io.on('connection', (socket) => {
  console.log('New connection:', socket.id);
  socket.on('join', ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });

    if (error) return callback(error);

    socket.join(user.room);

    socket.emit('message', { user: 'admin', text: `${user.name}, welcome to room ${user.room}.` });
    socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} has joined!` });

    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    });

    callback();
  });

  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);
    if (!user) return;

    io.to(user.room).emit('message', { user: user.name, text: message });
    io.to(user.room).emit('roomData', { room: user.room,  users: getUsersInRoom(user.room) });
    callback();
  });

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit('message', { user: 'Admin', text: `${user.name} has left.` });
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      });
    }
  });
});

server.listen(process.env.PORT || 5000, () =>
  console.log(`Server started on port ${process.env.PORT || 5000}`)
);
