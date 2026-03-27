const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

// ፋይሎቹን እንዲያገኝ ማድረግ
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// የመልዕክት ታሪክን ለጊዜው በሜሞሪ ለመያዝ
let msgHistory = [];

io.on('connection', (socket) => {
  console.log('አዲስ የጸጥታ አባል ተገናኝቷል');

  // 1. የቆዩ መልዕክቶችን ለአዲስ ገቢ መላክ
  socket.emit('chat_history', msgHistory);

  // 2. የደህንነት ቁልፍ ማረጋገጫ
  socket.on('verify_secure_access', (data) => {
    const MASTER_KEY = "OMO_SAFETY_2026_SECURE"; 
    if (data.key === MASTER_KEY) {
      socket.emit('login_success', { user: data.username });
    } else {
      socket.emit('login_failed', { message: "የተሳሳተ የደህንነት ቁልፍ ነው!" });
    }
  });

  // 3. መልዕክት ሲላላኩ ታሪክ ውስጥ መመዝገብ
  socket.on('chat_message', (data) => {
    msgHistory.push(data);
    // ታሪኩ ከ 200 በላይ እንዳይሆን (ሜሞሪ እንዳይጨናነቅ)
    if(msgHistory.length > 200) msgHistory.shift(); 
    
    io.emit('chat_message', data);
  });

  // 4. የቪዲዮ/ድምፅ ጥሪ ማስተላለፊያ (Signaling)
  // አንድ ሰው ሲደውል ለሌላው "ጥሪ እየመጣ ነው" ይላል
  socket.on('call_user', (data) => {
    console.log(`${data.from} ጥሪ እየጀመረ ነው...`);
    socket.broadcast.emit('incoming_call', data);
  });

  // 5. ጥሪ ሲቋረጥ ለሁሉም ማሳወቅ
  socket.on('end_call', () => {
    io.emit('call_ended');
  });

  socket.on('disconnect', () => {
    console.log('አባል ተቋርጧል');
  });
});

// ሰርቨሩን በ Render ፖርት ወይም በ 10000 ማስጀመር
const PORT = process.env.PORT || 10000;
http.listen(PORT, () => {
  console.log(`🛡️ TETA SECURE Command Center is running on port ${PORT}`);
});
