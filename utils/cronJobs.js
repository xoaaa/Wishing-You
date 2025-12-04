const cron = require('node-cron');
const User = require('../models/user');
const Message = require('../models/message');
const { sendBirthdayEmail } = require('./emailService');

const checkBirthdaysAndSendEmails = async () => {
  try {
    console.log('Checking for birthdays today...');
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayFormatted = `${month}-${day}`;

    console.log(`Today's date: ${todayFormatted}`);

    const birthdayUsers = await User.find({ birthday_date: todayFormatted });

    if (birthdayUsers.length === 0) {
      console.log('No users have birthdays today');
      return;
    }

    console.log(`Found ${birthdayUsers.length} user(s) with birthday today`);

    for (const user of birthdayUsers) {
      try {
        const messageCount = await Message.countDocuments({
          target_birthday: todayFormatted
        });

        await sendBirthdayEmail(user.email, user.username, messageCount);
        console.log(`Email sent to ${user.username} (${user.email})`);
      } catch (emailError) {
        console.error(`Failed to send email to ${user.email}:`, emailError.message);
      }
    }

    console.log('Birthday email check completed');
  } catch (error) {
    console.error('Error in birthday check:', error.message);
  }
};

const setupCronJobs = () => {
  cron.schedule('0 8 * * *', () => {
    console.log('Running scheduled birthday check...');
    checkBirthdaysAndSendEmails();
  });

  console.log('Cron job scheduled: Birthday emails will be sent daily at 8:00 AM');
};

const manualBirthdayCheck = async () => {
  console.log('Manual birthday check triggered');
  await checkBirthdaysAndSendEmails();
};

module.exports = {
  setupCronJobs,
  manualBirthdayCheck
};