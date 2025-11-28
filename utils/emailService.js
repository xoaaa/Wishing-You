const nodemailer = require('nodemailer');

// Setup transporter untuk Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Function untuk kirim email birthday notification
const sendBirthdayEmail = async (userEmail, username, messageCount) => {
  try {
    const mailOptions = {
      from: `"Wishing You 🎂" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `🎉 Happy Birthday, ${username}! 🎂`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              background-color: #f4f4f4;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 50px auto;
              background-color: #ffffff;
              border-radius: 10px;
              overflow: hidden;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 40px 20px;
              text-align: center;
              color: white;
            }
            .header h1 {
              margin: 0;
              font-size: 32px;
            }
            .header p {
              margin: 10px 0 0;
              font-size: 18px;
            }
            .content {
              padding: 40px 30px;
              text-align: center;
            }
            .content p {
              font-size: 16px;
              line-height: 1.6;
              color: #333;
            }
            .message-count {
              background-color: #f0f0f0;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
            }
            .message-count h2 {
              color: #667eea;
              margin: 0 0 10px;
              font-size: 48px;
            }
            .message-count p {
              margin: 0;
              color: #666;
            }
            .button {
              display: inline-block;
              padding: 15px 40px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-decoration: none;
              border-radius: 50px;
              font-weight: bold;
              margin-top: 20px;
              transition: transform 0.3s;
            }
            .button:hover {
              transform: scale(1.05);
            }
            .footer {
              background-color: #f9f9f9;
              padding: 20px;
              text-align: center;
              color: #999;
              font-size: 12px;
            }
            .emoji {
              font-size: 48px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Happy Birthday! 🎂</h1>
              <p>Dear ${username}</p>
            </div>
            <div class="content">
              <div class="emoji">🎁✨🎈</div>
              <p>
                Today is your special day, and people from around the world 
                have sent you warm birthday wishes!
              </p>
              <div class="message-count">
                <h2>${messageCount}</h2>
                <p>Birthday Messages Waiting For You!</p>
              </div>
              <p>
                Click the button below to read all the heartfelt messages 
                people have written just for you.
              </p>
              <a href="${process.env.CLIENT_URL}" class="button">
                Open Your Birthday Messages 🎁
              </a>
              <p style="margin-top: 30px; color: #999; font-size: 14px;">
                May this year bring you happiness, success, and all the wonderful 
                things you deserve. Have an amazing birthday! 🌟
              </p>
            </div>
            <div class="footer">
              <p>This email was sent from Wishing You - A platform for sharing birthday love</p>
              <p>© ${new Date().getFullYear()} Wishing You. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${userEmail}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Error sending email to ${userEmail}:`, error.message);
    return { success: false, error: error.message };
  }
};

// Function untuk test email connection
const testEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log('✅ Email service is ready to send messages');
    return true;
  } catch (error) {
    console.error('❌ Email service error:', error.message);
    return false;
  }
};

module.exports = {
  sendBirthdayEmail,
  testEmailConnection
};