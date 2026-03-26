const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const twilio = require('twilio');

// 1. Database Setup
const adapter = new FileSync('db.json');
const db = low(adapter);
db.defaults({ users: [], messages: [] }).write();

// 2. Twilio Setup (ከ Twilio የምታገኘውን እዚህ ተካ)
const accountSid = 'YOUR_TWILIO_ACCOUNT_SID'; 
const authToken = 'YOUR_TWILIO_AUTH_TOKEN';
const twilioNumber = 'YOUR_TWILIO_PHONE_NUMBER';
const client = new twilio(accountSid, authToken);

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
    maxHttpBufferSize: 1e8, 
    cors: { origin: "*" } 
});

app.use(express.static(path.join(__dirname)));

io.on('connection', (socket) => {
    // የቆዩ መልዕክቶችን መላክ
    socket.emit('chat_history', db.get('messages').value());

    // ምዝገባ
    socket.on('register', (data) => {
        const vCode = Math.floor(1000 + Math.random() * 9000);
        db.get('users').push({ ...data, code: vCode }).write();
        socket.emit('registered', { code: vCode });
    });

    // መግቢያ እና SMS መላክ
    socket.on('login', (data) => {
        const user = db.get('users').find(u => 
            (u.username === data.username || u.contact === data.username) && 
            u.password === data.password
        ).value();

        if (user) {
            const newCode = Math.floor(1000 + Math.random() * 9000);
            db.get('users').find({ username: user.username }).assign({ code: newCode }).write();
            
            // እውነተኛ SMS መላኪያ (Twilio)
            /* client.messages.create({
                body: `TETA SECURE: የእርስዎ ሚስጥራዊ ኮድ ${newCode} ነው።`,
                to: user.contact, 
                from: twilioNumber
            }).then(() => console.log("SMS ተልኳል")).catch(e => console.log(e));
            */

            socket.emit('login_success', { code: newCode });
        } else {
            socket.emit('auth_error', 'የተሳሳተ መረጃ!');
        }
    });

    socket.on('chat_message', (data) => {
        db.get('messages').push(data).write();
        io.emit('chat_message', data);
    });

    socket.on('call_signal', (data) => socket.broadcast.emit('receive_signal', data));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🛡️ TETA SECURE ONLINE ON PORT ${PORT}`);
});
