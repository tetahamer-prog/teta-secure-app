const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { maxHttpBufferSize: 1e8 });
const fs = require('fs');
const path = require('path');

app.use(express.static(__dirname));
const RECORDS_DIR = path.join(__dirname, 'TETA_RECORDS');
if (!fs.existsSync(RECORDS_DIR)) fs.mkdirSync(RECORDS_DIR);

io.on('connection', (socket) => {
    socket.on('verify_secure_access', (data) => {
        if (data.key === "OMO_SAFETY_2026_SECURE") {
            socket.username = data.username;
            const userPath = path.join(RECORDS_DIR, data.username);
            if (!fs.existsSync(userPath)) fs.mkdirSync(userPath);
            socket.emit('login_success');
        }
    });

    // AI ድምፅ ሰምቶ ምላሽ እንዲሰጥ
    socket.on('ask_teta_ai', (question) => {
        console.log(`ጥያቄ በድምፅ ቀርቧል: ${question}`);
        
        // AI Analysis (Simulation)
        let responseText = "";
        if(question.includes("ሰላም")) {
            responseText = `ሰላም ${socket.username}፣ የደቡብ ኦሞ ጸጥታ ረዳትዎ ነኝ። ምን ልርዳዎት?`;
        } else if(question.includes("ማነህ")) {
            responseText = "እኔ ቴታ ኤአይ ነኝ። በሰው ሰራሽ አስተውሎት የታገዝኩ የጸጥታ ረዳት ነኝ።";
        } else {
            responseText = `ለጥያቄዎ "${question}" ትንታኔ እየሰራሁ ነው። በአሁኑ ሰዓት ያለው መረጃ ሰላማዊ እንደሆነ ያሳያል።`;
        }

        // ምላሹን ወደ ተጠቃሚው መላክ
        socket.emit('ai_voice_response', { 
            user: "TETA AI ✨", 
            text: responseText 
        });
    });

    socket.on('chat_message', (d) => io.emit('chat_message', d));
});

http.listen(10000, () => console.log('TETA VOICE AI v4.5 LIVE!'));
