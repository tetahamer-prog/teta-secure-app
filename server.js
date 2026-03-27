const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ለጊዜው መልዕክቶችን በሜሞሪ ለመያዝ (ዳታቤዝ እስክናገናኝ)
let msgHistory = [];

io.on('connection', (socket) => {
  console.log('አዲስ ሰው ተገናኝቷል');

  // የቆዩ መልዕክቶችን ለአዲስ ሰው መላክ
  socket.emit('chat_history', msgHistory);

  socket.on('verify_secure_access', (data) => {
    const MASTER_KEY = "OMO_SAFETY_2026_SECURE"; 
    if (data.key === MASTER_KEY) {
      socket.emit('login_success', { user: data.username });
    } else {
      socket.emit('login_failed', { message: "የተሳሳተ የደህንነት ቁልፍ ነው!" });
    }
  });

  socket.on('chat_message', (data) => {
    // መልዕክቱን ታሪክ ውስጥ መመዝገብ
    msgHistory.push(data);
    if(msgHistory.length > 100) msgHistory.shift(); // ከ100 በላይ ሲሆን የድሮውን አጥፋ
    
    io.emit('chat_message', data);
  });
});

const PORT = process.env.PORT || 10000;
http.listen(PORT, () => {
  console.log(`TETA SECURE is live on port ${PORT}`);
});
