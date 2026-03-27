const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { maxHttpBufferSize: 1e8 });
const fs = require('fs');
const path = require('path');

app.use(express.static(__dirname));

// ፎልደር የመፍጠር ስራ
const ensureFolder = (user) => {
    const dir = path.join(__dirname, 'TETA_RECORDS', user);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

let users = {};

io.on('connection', (socket) => {
    socket.on('verify_secure_access', (data) => {
        if (data.key === "OMO_SAFETY_2026_SECURE") {
            users[data.username] = { id: socket.id, lastSeen: 'Online' };
            socket.username = data.username;
            ensureFolder(data.username); // ፎልደር ክፈት
            socket.emit('login_success');
            io.emit('user_status', { allUsers: users });
        }
    });

    socket.on('chat_message', (data) => {
        io.emit('chat_message', data);
    });

    // የተቀረጸ ጥሪን በሰውየው ፎልደር ውስጥ መቅዳት
    socket.on('save_call_record', (data) => {
        const filePath = path.join(__dirname, 'TETA_RECORDS', socket.username, data.fileName);
        const base64Data = data.blob.split(',')[1];
        fs.writeFile(filePath, base64Data, 'base64', (err) => {
            if (!err) console.log(`${socket.username} ጥሪ ቀድቶ አስቀምጧል`);
        });
    });

    socket.on('disconnect', () => {
        if (socket.username) {
            users[socket.username].lastSeen = new Date().toLocaleTimeString();
            io.emit('user_status', { allUsers: users });
        }
    });
});

http.listen(10000, () => console.log('TETA SECURE v3.0 FULL PRO - Running...'));
