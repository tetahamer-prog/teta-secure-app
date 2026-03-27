const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { 
    maxHttpBufferSize: 1e8 // ትላልቅ የቪዲዮ ፋይሎችን (እስከ 100MB) ለመቀበል
});
const fs = require('fs');
const path = require('path');

// 1. መሰረታዊ ማህደሮችን ማዘጋጀት
const RECORDS_DIR = path.join(__dirname, 'TETA_RECORDS');

// የሪከርድ ማከማቻ ፎልደር ከሌለ ይፈጠራል
if (!fs.existsSync(RECORDS_DIR)) {
    fs.mkdirSync(RECORDS_DIR);
}

// ለእያንዳንዱ ተጠቃሚ በስሙ ፎልደር የሚከፍት ፋንክሽን
const ensureUserFolder = (username) => {
    const userPath = path.join(RECORDS_DIR, username);
    if (!fs.existsSync(userPath)) {
        fs.mkdirSync(userPath, { recursive: true });
        console.log(`📁 ለ ${username} አዲስ ፎልደር ተከፍቷል`);
    }
};

app.use(express.static(__dirname));

let activeUsers = {}; // ኦንላይን ያሉ ሰዎችን ለመያዝ

io.on('connection', (socket) => {
    console.log('አዲስ ግንኙነት ተፈጠረ');

    // 2. የደህንነት ማረጋገጫ (Login)
    socket.on('verify_secure_access', (data) => {
        const MASTER_KEY = "OMO_SAFETY_2026_SECURE";
        
        if (data.key === MASTER_KEY) {
            socket.username = data.username;
            activeUsers[data.username] = { 
                id: socket.id, 
                lastSeen: 'Online',
                loginTime: new Date().toLocaleString()
            };

            // ለእያንዳንዱ ሰው የግል ፎልደር መክፈት
            ensureUserFolder(data.username);

            socket.emit('login_success');
            io.emit('user_status', { allUsers: activeUsers });
            console.log(`✅ ${data.username} ገብቷል`);
        } else {
            socket.emit('login_failed', { message: "የተሳሳተ የደህንነት ቁልፍ!" });
        }
    });

    // 3. የመልዕክት ልውውጥ (Chat)
    socket.on('chat_message', (data) => {
        // ሰዓት መጨመር
        data.time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        // መልዕክቱን ለሁሉም ማሰራጨት
        io.emit('chat_message', data);
        
        // AI Logic (Simulation)
        if (data.text.includes("?") || data.text.length > 15) {
            setTimeout(() => {
                const aiResponse = {
                    user: "TETA AI ✨",
                    text: `የደህንነት ትንታኔ፡ "${data.text}" የሚለው መልዕክት ተመርምሯል። ምንም አይነት ስጋት የለበትም።`,
                    isAI: true,
                    time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                };
                io.emit('chat_message', aiResponse);
            }, 1500);
        }
    });

    // 4. የጥሪ ቅጂዎችን (Call Records) ማስቀመጥ
    socket.on('save_call_record', (data) => {
        if (!socket.username) return;

        const userFolder = path.join(RECORDS_DIR, socket.username);
        const filePath = path.join(userFolder, data.fileName);
        
        // Base64 ዳታውን ወደ ፋይል መቀየር
        const base64Data = data.blob.split(',')[1];
        
        fs.writeFile(filePath, base64Data, 'base64', (err) => {
            if (err) {
                console.error(`❌ ፋይል ማስቀመጥ አልተቻለም፡ ${err}`);
            } else {
                console.log(`🎥 የጥሪ ቅጂ በ ${socket.username} ፎልደር ተቀምጧል፡ ${data.fileName}`);
            }
        });
    });

    // 5. ግንኙነት ሲቋረጥ
    socket.on('disconnect', () => {
        if (socket.username && activeUsers[socket.username]) {
            activeUsers[socket.username].lastSeen = new Date().toLocaleTimeString();
            io.emit('user_status', { allUsers: activeUsers });
            console.log(`🚩 ${socket.username} ወጥቷል`);
        }
    });
});

// ሰርቨሩን ማስጀመር
const PORT = process.env.PORT || 10000;
http.listen(PORT, () => {
    console.log(`-------------------------------------------`);
    console.log(`🛡️ TETA SECURE PRO v3.0 ዝግጁ ነው!`);
    console.log(`🚀 ሰርቨሩ በፖርት ${PORT} ላይ እየሰራ ነው...`);
    console.log(`-------------------------------------------`);
});
