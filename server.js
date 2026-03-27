const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { maxHttpBufferSize: 1e8 });
const path = require('path');

app.use(express.static(__dirname));

let users = {}; // { username: socketId }
let msgHistory = [];

io.on('connection', (socket) => {
    
    socket.on('verify_secure_access', (data) => {
        if (data.key === "OMO_SAFETY_2026_SECURE") {
            users[data.username] = socket.id;
            socket.username = data.username;
            
            socket.emit('login_success', { user: data.username });
            
            // ማን እንደገባ ለሁሉም ማሳወቅ
            io.emit('user_status', { user: data.username, status: 'online', allUsers: Object.keys(users) });
            socket.emit('chat_history', msgHistory);
        }
    });

    // ለግል ወይም ለሁሉም መልዕክት መላኪያ
    socket.on('chat_message', (data) => {
        if (data.to) { // የግል መልዕክት ከሆነ
            const targetId = users[data.to];
            if (targetId) io.to(targetId).emit('chat_message', data);
            socket.emit('chat_message', data); // ለላኪውም እንዲታየው
        } else { // ለሁሉም ከሆነ
            msgHistory.push(data);
            if(msgHistory.length > 100) msgHistory.shift();
            io.emit('chat_message', data);
        }
    });

    // ለግል ጥሪ ማስተላለፊያ
    socket.on('call_user', (data) => {
        const targetId = users[data.to];
        if (targetId) io.to(targetId).emit('incoming_call', data);
    });

    socket.on('disconnect', () => {
        if (socket.username) {
            delete users[socket.username];
            // ማን እንደወጣ ለሁሉም ማሳወቅ
            io.emit('user_status', { user: socket.username, status: 'offline', allUsers: Object.keys(users) });
        }
    });
});

const PORT = process.env.PORT || 10000;
http.listen(PORT, () => console.log(`Server running on ${PORT}`));
