const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { maxHttpBufferSize: 1e8 });
const path = require('path');

app.use(express.static(__dirname));

let users = {}; // { username: { id: socketId, lastSeen: 'Online', status: 'Available' } }
let msgHistory = [];

io.on('connection', (socket) => {
    socket.on('verify_secure_access', (data) => {
        const MASTER_KEY = "OMO_SAFETY_2026_SECURE";
        if (data.key === MASTER_KEY) {
            users[data.username] = { id: socket.id, lastSeen: 'Online', status: 'Available' };
            socket.username = data.username;
            socket.emit('login_success', { user: data.username });
            io.emit('user_status', { allUsers: users });
            socket.emit('chat_history', msgHistory);
        } else {
            socket.emit('login_failed', { message: "የተሳሳተ የደህንነት ቁልፍ!" });
        }
    });

    socket.on('chat_message', (data) => {
        if (data.to) {
            const target = users[data.to];
            if (target) io.to(target.id).emit('chat_message', data);
            socket.emit('chat_message', data); 
        } else {
            msgHistory.push(data);
            if(msgHistory.length > 150) msgHistory.shift();
            io.emit('chat_message', data);
        }
    });

    socket.on('call_user', (data) => {
        const target = users[data.to];
        if (target) io.to(target.id).emit('incoming_call', data);
    });

    socket.on('disconnect', () => {
        if (socket.username && users[socket.username]) {
            users[socket.username].lastSeen = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            io.emit('user_status', { allUsers: users });
            delete users[socket.username].id; // ግንኙነቱ መቋረጡን ለማወቅ
        }
    });
});

const PORT = process.env.PORT || 10000;
http.listen(PORT, () => console.log(`TETA SECURE PRO Live on ${PORT}`));
