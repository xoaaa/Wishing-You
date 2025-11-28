const cron = require('node-cron');
const User = require('../models/user');
const Message = require('../models/message');
const { sendBirthdayEmail } = require('./utils/emailService');

// Function untuk cek dan kirim birthday emails
const checkBirthdaysAndSendEmails = async () => {
  try {
    console.log('🔍 Checking for birthdays today...');

    // Ambil tanggal hari ini dalam format MM-DD
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayFormatted = `${month}-${day}`;

    console.log(`📅 Today's date: ${todayFormatted}`);

    // Cari users yang ulang tahun hari ini
    const birthdayUsers = await User.find({ birthday_date: todayFormatted });

    if (birthdayUsers.length === 0) {
      console.log('👥 No users have birthdays today');
      return;
    }

    console.log(`🎂 Found ${birthdayUsers.length} user(s) with birthday today`);

    // Kirim email ke setiap user
    for (const user of birthdayUsers) {
      try {
        // Hitung jumlah messages untuk user ini
        const messageCount = await Message.countDocuments({
          target_birthday: todayFormatted
        });

        // Kirim email
        await sendBirthdayEmail(user.email, user.username, messageCount);
        console.log(`✉️  Email sent to ${user.username} (${user.email})`);
      } catch (emailError) {
        console.error(`❌ Failed to send email to ${user.email}:`, emailError.message);
      }
    }

    console.log('✅ Birthday email check completed');
  } catch (error) {
    console.error('❌ Error in birthday check:', error.message);
  }
};

// Setup cron job - jalan setiap hari jam 8 pagi
const setupCronJobs = () => {
  // Format: "detik menit jam hari bulan hari_minggu"
  // '0 8 * * *' = setiap hari jam 8:00 pagi
  cron.schedule('0 8 * * *', () => {
    console.log('⏰ Running scheduled birthday check...');
    checkBirthdaysAndSendEmails();
  });

  console.log('⏰ Cron job scheduled: Birthday emails will be sent daily at 8:00 AM');

  // Optional: Untuk testing, uncomment baris di bawah
  // Ini akan jalan setiap 1 menit (untuk testing saja!)
  // cron.schedule('* * * * *', () => {
  //   console.log('⏰ [TEST] Running birthday check (every minute)...');
  //   checkBirthdaysAndSendEmails();
  // });
};

// Function manual untuk test (bisa dipanggil dari route)
const manualBirthdayCheck = async () => {
  console.log('🔧 Manual birthday check triggered');
  await checkBirthdaysAndSendEmails();
};

module.exports = {
  setupCronJobs,
  manualBirthdayCheck
};