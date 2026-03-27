const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const twilio = require('twilio');

// Twilio Setup (ከ Render Variables የሚመጡ)
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
let tempOTP = {}; // ለጊዜው ኮዶችን የምንይዝበት

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
  console.log('A user connected');

  // 1. ሚስጥራዊ ኮድ (OTP) ወደ ስልክ ለመላክ
  socket.on('send_otp', (data) => {
    const otp = Math.floor(100000 + Math.random() * 900000); // 6 ዲጂት ኮድ
    tempOTP[data.phone] = otp;

    client.messages.create({
      body: `TETA SECURE: ያንተ ሚስጥራዊ መግቢያ ኮድ ${otp} ነው። ለማንም እንዳትሰጥ!`,
      from: process.env.TWILIO_PHONE,
      to: data.phone
    })
    .then(() => socket.emit('otp_sent', { success: true }))
    .catch(err => socket.emit('otp_sent', { success: false, error: err.message }));
  });

  // 2. ኮዱን በትክክል መሆኑን ለማረጋገጥ
  socket.on('verify_otp', (data) => {
    if (tempOTP[data.phone] && tempOTP[data.phone] == data.code) {
      socket.emit('login_success', { user: data.username });
    } else {
      socket.emit('login_failed', { message: "የተሳሳተ ኮድ ነው!" });
    }
  });

  // 3. መልዕክት መላላኪያ
  socket.on('chat_message', (msg) => {
    io.emit('chat_message', msg);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 10000;
http.listen(PORT, () => {
  console.log(`TETA Server running on port ${PORT}`);
});
