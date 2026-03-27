const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
  console.log('A user connected');

  // ሚስጥራዊ ቁልፍ ማረጋገጫ
  socket.on('verify_secure_access', (data) => {
    // ይህን ቁልፍ ለሰራተኞች ብቻ ነው የምትሰጠው
    const MASTER_KEY = "OMO_SAFETY_2026_SECURE"; 
    
    if (data.key === MASTER_KEY) {
      socket.emit('login_success', { user: data.username });
    } else {
      socket.emit('login_failed', { message: "የተሳሳተ የደህንነት ቁልፍ ነው! እባክዎ በትክክል ያስገቡ።" });
    }
  });

  socket.on('chat_message', (msg) => {
    io.emit('chat_message', msg);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 10000;
http.listen(PORT, () => {
  console.log(`TETA SECURE is running on port ${PORT}`);
});
