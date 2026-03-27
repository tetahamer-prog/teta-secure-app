const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const twilio = require('twilio');

// መረጃዎቹን ከ Render Environment Variables ይወስዳል
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
const serviceSid = process.env.VERIFY_SERVICE_SID; 

app.use(express.static(__dirname));

io.on('connection', (socket) => {
  
  // 1. ኮድ ለመላክ (Verification Start)
  socket.on('send_otp', (data) => {
    client.verify.v2.services(serviceSid)
      .verifications
      .create({to: data.phone, channel: 'sms'})
      .then(verification => socket.emit('otp_sent', { success: true }))
      .catch(err => socket.emit('otp_sent', { success: false, error: err.message }));
  });

  // 2. የተላከውን ኮድ ለማረጋገጥ (Verification Check)
  socket.on('verify_otp', (data) => {
    client.verify.v2.services(serviceSid)
      .verificationChecks
      .create({to: data.phone, code: data.code})
      .then(verification_check => {
        if (verification_check.status === 'approved') {
          socket.emit('login_success', { user: data.username });
        } else {
          socket.emit('login_failed', { message: "የተሳሳተ ኮድ ነው!" });
        }
      })
      .catch(err => socket.emit('login_failed', { message: err.message }));
  });

  socket.on('chat_message', (msg) => {
    io.emit('chat_message', msg);
  });
});

const PORT = process.env.PORT || 10000;
http.listen(PORT, () => {
  console.log(`TETA SECURE running with Twilio Verify`);
});
