const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { maxHttpBufferSize: 1e8 });
const fs = require('fs');
const path = require('path');

const RECORDS_DIR = path.join(__dirname, 'TETA_RECORDS');
if (!fs.existsSync(RECORDS_DIR)) fs.mkdirSync(RECORDS_DIR);

const ensureUserFolder = (user) => {
    const userPath = path.join(RECORDS_DIR, user);
    if (!fs.existsSync(userPath)) fs.mkdirSync(userPath, { recursive: true });
};

app.use(express.static(__dirname));

let users = {};

io.on('connection', (socket) => {
    socket.on('verify_secure_access', (data) => {
        if (data.key === "OMO_SAFETY_2026_SECURE") {
            socket.username = data.username;
            users[data.username] = { id: socket.id, lastSeen: 'Online', phone: '09********' };
            ensureUserFolder(data.username);
            socket.emit('login_success', { user: data.username });
            io.emit('user_status', { allUsers: users });
        }
    });

    socket.on('chat_message', (data) => {
        data.time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        io.emit('chat_message', data);
    });

    socket.on('save_call_record', (data) => {
        if (!socket.username) return;
        const filePath = path.join(RECORDS_DIR, socket.username, data.fileName);
        const base64Data = data.blob.split(',')[1];
        fs.writeFile(filePath, base64Data, 'base64', (err) => {
            if (!err) console.log(`Recording Saved for ${socket.username}`);
        });
    });

    socket.on('disconnect', () => {
        if (socket.username) {
            if(users[socket.username]) users[socket.username].lastSeen = new Date().toLocaleTimeString();
            io.emit('user_status', { allUsers: users });
        }
    });
});

http.listen(10000, () => console.log('TETA v3.1 PRO LIVE!'));
