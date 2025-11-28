// ========================================
// GLOBAL STATE
// ========================================
let currentUser = null;
let authToken = localStorage.getItem('token');

// ========================================
// INITIALIZATION
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is logged in
  if (authToken) {
    loadUserProfile();
  }

  // Setup form listeners
  setupFormListeners();

  // Character counter for message
  document.getElementById('messageText').addEventListener('input', (e) => {
    const charCount = e.target.value.length;
    document.getElementById('charCount').textContent = `${charCount} / 1000 characters`;
  });
});

// ========================================
// NAVIGATION
// ========================================
function showSection(sectionName) {
  // Hide all sections
  document.querySelectorAll('.section').forEach(section => {
    section.classList.remove('active');
  });

  // Show selected section
  const section = document.getElementById(`${sectionName}-section`);
  if (section) {
    section.classList.add('active');
  }

  // Load data if needed
  if (sectionName === 'profile' && authToken) {
    loadUserProfile();
    loadUserMessages();
  }
}

// ========================================
// AUTHENTICATION
// ========================================
function setupFormListeners() {
  // Login Form
  document.getElementById('loginForm').addEventListener('submit', handleLogin);

  // Register Form
  document.getElementById('registerForm').addEventListener('submit', handleRegister);

  // Send Message Form
  document.getElementById('sendMessageForm').addEventListener('submit', handleSendMessage);

  // View Messages Form
  document.getElementById('viewMessageForm').addEventListener('submit', handleViewMessages);
}

async function handleLogin(e) {
  e.preventDefault();
  showLoading();

  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      authToken = data.token;
      currentUser = data.user;
      localStorage.setItem('token', authToken);
      
      showToast('Login successful! Welcome back 🎉', 'success');
      updateAuthUI();
      showSection('home');
      
      document.getElementById('loginForm').reset();
    } else {
      showToast(data.error || 'Login failed', 'error');
    }
  } catch (error) {
    showToast('Connection error. Please try again.', 'error');
  } finally {
    hideLoading();
  }
}

async function handleRegister(e) {
  e.preventDefault();
  showLoading();

  const username = document.getElementById('registerUsername').value;
  const email = document.getElementById('registerEmail').value;
  const password = document.getElementById('registerPassword').value;
  const birthday = document.getElementById('registerBirthday').value;

  // Convert birthday to MM-DD format
  const birthdayDate = new Date(birthday);
  const month = String(birthdayDate.getMonth() + 1).padStart(2, '0');
  const day = String(birthdayDate.getDate()).padStart(2, '0');
  const birthday_date = `${month}-${day}`;

  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, birthday_date })
    });

    const data = await response.json();

    if (response.ok) {
      authToken = data.token;
      currentUser = data.user;
      localStorage.setItem('token', authToken);
      
      showToast('Registration successful! Welcome to Wishing You 🎂', 'success');
      updateAuthUI();
      showSection('home');
      
      document.getElementById('registerForm').reset();
    } else {
      showToast(data.error || 'Registration failed', 'error');
    }
  } catch (error) {
    showToast('Connection error. Please try again.', 'error');
  } finally {
    hideLoading();
  }
}

function logout() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('token');
  
  updateAuthUI();
  showToast('Logged out successfully', 'success');
  showSection('home');
}

function updateAuthUI() {
  const authBtn = document.getElementById('authBtn');
  const profileBtn = document.getElementById('profileBtn');
  const logoutBtn = document.getElementById('logoutBtn');

  if (authToken) {
    authBtn.style.display = 'none';
    profileBtn.style.display = 'block';
    logoutBtn.style.display = 'block';
  } else {
    authBtn.style.display = 'block';
    profileBtn.style.display = 'none';
    logoutBtn.style.display = 'none';
  }
}

function toggleAuth() {
  const loginCard = document.getElementById('loginCard');
  const registerCard = document.getElementById('registerCard');

  if (loginCard.style.display === 'none') {
    loginCard.style.display = 'block';
    registerCard.style.display = 'none';
  } else {
    loginCard.style.display = 'none';
    registerCard.style.display = 'block';
  }
}

// ========================================
// MESSAGES
// ========================================
async function handleSendMessage(e) {
  e.preventDefault();
  showLoading();

  const sender_name = document.getElementById('senderName').value || 'Anonymous';
  const message_text = document.getElementById('messageText').value;
  const birthdayDate = document.getElementById('birthdayDate').value;

  // Convert to MM-DD format
  const date = new Date(birthdayDate);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const target_birthday = `${month}-${day}`;

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch('/api/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify({ sender_name, message_text, target_birthday })
    });

    const data = await response.json();

    if (response.ok) {
      showToast('Birthday message sent successfully! 🎉', 'success');
      document.getElementById('sendMessageForm').reset();
      document.getElementById('charCount').textContent = '0 / 1000 characters';
    } else {
      showToast(data.error || 'Failed to send message', 'error');
    }
  } catch (error) {
    showToast('Connection error. Please try again.', 'error');
  } finally {
    hideLoading();
  }
}

async function handleViewMessages(e) {
  e.preventDefault();
  showLoading();

  const birthdayDate = document.getElementById('viewBirthdayDate').value;

  // Convert to MM-DD format
  const date = new Date(birthdayDate);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const target_birthday = `${month}-${day}`;

  try {
    const response = await fetch(`/api/messages/${target_birthday}`);
    const data = await response.json();

    if (response.ok) {
      displayMessages(data);
    } else {
      showToast(data.error || 'Failed to load messages', 'error');
    }
  } catch (error) {
    showToast('Connection error. Please try again.', 'error');
  } finally {
    hideLoading();
  }
}

function displayMessages(data) {
  const container = document.getElementById('messagesContainer');
  const title = document.getElementById('messagesTitle');
  const count = document.getElementById('messagesCount');
  const list = document.getElementById('messagesList');

  title.textContent = `🎂 Birthday Messages for ${data.date}`;
  count.textContent = `${data.count} message(s) found`;

  if (data.messages.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🎁</div>
        <p>No birthday messages yet for this date.</p>
        <p>Be the first to send one!</p>
      </div>
    `;
  } else {
    list.innerHTML = data.messages.map(msg => {
      const createdDate = new Date(msg.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      return `
        <div class="message-card">
          <div class="message-header">
            <span class="message-sender">
              ${msg.sender_name === 'Anonymous' ? '🎭 Anonymous' : '👤 ' + msg.sender_name}
            </span>
            <span class="message-date">${createdDate}</span>
          </div>
          <div class="message-text">${escapeHtml(msg.message_text)}</div>
          ${msg.reactions && msg.reactions.length > 0 ? `
            <div class="message-footer">
              ${msg.reactions.map(r => `<span class="reaction-badge">${r.emoji}</span>`).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  container.style.display = 'block';
}

// ========================================
// PROFILE
// ========================================
async function loadUserProfile() {
  if (!authToken) return;

  try {
    const response = await fetch('/api/auth/profile', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();

    if (response.ok) {
      currentUser = data.user;
      updateAuthUI();
      displayProfile(data.user);
    } else {
      logout();
    }
  } catch (error) {
    console.error('Failed to load profile:', error);
  }
}

function displayProfile(user) {
  const profileInfo = document.getElementById('profileInfo');
  profileInfo.innerHTML = `
    <div class="profile-info">
      <div class="profile-item">
        <span class="profile-label">👤 Username:</span>
        <span class="profile-value">${user.username}</span>
      </div>
      <div class="profile-item">
        <span class="profile-label">📧 Email:</span>
        <span class="profile-value">${user.email}</span>
      </div>
      <div class="profile-item">
        <span class="profile-label">🎂 Birthday:</span>
        <span class="profile-value">${user.birthday_date}</span>
      </div>
      <div class="profile-item">
        <span class="profile-label">📅 Member Since:</span>
        <span class="profile-value">${new Date(user.created_at).toLocaleDateString()}</span>
      </div>
    </div>
  `;
}

async function loadUserMessages() {
  if (!authToken) return;

  try {
    // Load sent messages
    const sentResponse = await fetch('/api/messages/user/sent', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const sentData = await sentResponse.json();

    // Load received messages
    const receivedResponse = await fetch('/api/messages/user/received', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const receivedData = await receivedResponse.json();

    displaySentMessages(sentData);
    displayReceivedMessages(receivedData);
  } catch (error) {
    console.error('Failed to load user messages:', error);
  }
}

function displaySentMessages(data) {
  const container = document.getElementById('sentMessages');

  if (data.messages.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">✉️</div>
        <p>You haven't sent any messages yet.</p>
      </div>
    `;
  } else {
    container.innerHTML = data.messages.map(msg => {
      return `
        <div class="message-card">
          <div class="message-header">
            <span class="message-sender">To: ${msg.target_birthday}</span>
            <span class="message-date">${new Date(msg.created_at).toLocaleDateString()}</span>
          </div>
          <div class="message-text">${escapeHtml(msg.message_text)}</div>
        </div>
      `;
    }).join('');
  }
}

function displayReceivedMessages(data) {
  const container = document.getElementById('receivedMessages');

  if (data.messages.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🎁</div>
        <p>No birthday messages for you yet.</p>
      </div>
    `;
  } else {
    container.innerHTML = data.messages.map(msg => {
      return `
        <div class="message-card">
          <div class="message-header">
            <span class="message-sender">
              ${msg.sender_name === 'Anonymous' ? '🎭 Anonymous' : '👤 ' + msg.sender_name}
            </span>
            <span class="message-date">${new Date(msg.created_at).toLocaleDateString()}</span>
          </div>
          <div class="message-text">${escapeHtml(msg.message_text)}</div>
        </div>
      `;
    }).join('');
  }
}

// ========================================
// UI UTILITIES
// ========================================
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast show ${type}`;

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function showLoading() {
  document.getElementById('loadingSpinner').style.display = 'flex';
}

function hideLoading() {
  document.getElementById('loadingSpinner').style.display = 'none';
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}