const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  maxHttpBufferSize: 1e8 // 100MB ፋይል ለማስተላለፍ
});
const path = require('path');

app.use(express.static(__dirname));

let msgHistory = [];

io.on('connection', (socket) => {
  socket.emit('chat_history', msgHistory);

  socket.on('verify_secure_access', (data) => {
    if (data.key === "OMO_SAFETY_2026_SECURE") {
      socket.emit('login_success', { user: data.username });
    } else {
      socket.emit('login_failed', { message: "የተሳሳተ ቁልፍ!" });
    }
  });

  socket.on('chat_message', (data) => {
    msgHistory.push(data);
    if(msgHistory.length > 100) msgHistory.shift();
    io.emit('chat_message', data); // ለሁሉም ይላካል
  });

  // ለቪዲዮ ኮንፈረንስ - ጥሪ ሲጀመር ለሁሉም ማሳወቅ
  socket.on('start_conference', (data) => {
    socket.broadcast.emit('incoming_conference', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 10000;
http.listen(PORT, () => console.log(`TETA SECURE Server Live on ${PORT}`));
