// ========================================
// GLOBAL STATE
// ========================================
let currentUser = null;
let authToken = localStorage.getItem('token');
// Base URL for API requests (ensure this matches your running server)
const API_BASE = 'http://localhost:5000';

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

  // Character counter for edit message
  const editMessageText = document.getElementById('editMessageText');
  if (editMessageText) {
    editMessageText.addEventListener('input', (e) => {
      const charCount = e.target.value.length;
      document.getElementById('editCharCount').textContent = `${charCount} / 1000 characters`;
    });
  }

  // Character counter for birthday description (add/edit)
  const birthdayDesc = document.getElementById('birthdayDesc');
  if (birthdayDesc) {
    birthdayDesc.addEventListener('input', (e) => {
      const charCount = e.target.value.length;
      const el = document.getElementById('birthdayDescCount');
      if (el) el.textContent = `${charCount} / 500 characters`;
    });
  }

  // Character counter for comment
  const commentText = document.getElementById('commentText');
  if (commentText) {
    commentText.addEventListener('input', (e) => {
      const charCount = e.target.value.length;
      const el = document.getElementById('commentCharCount');
      if (el) el.textContent = `${charCount} / 500 characters`;
    });
  }
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

  if (sectionName === 'calendar' && authToken) {
    loadBirthdayCalendar();
  }
}

// ========================================
// AUTHENTICATION
// ========================================
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

    // 🆕 BARU: Daftarkan form untuk menambahkan/mengedit ulang tahun
    document.getElementById('birthdayForm').addEventListener('submit', handleBirthdaySubmit);
}

async function handleLogin(e) {
  e.preventDefault();
  showLoading();

  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const response = await fetch(API_BASE + '/api/auth/login', {
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

  // Convert birthday to MM-DD format (safer method to avoid timezone issues)
  const [year, m, d] = birthday.split('-');
  const birthday_date = `${m}-${d}`;

  try {
    const response = await fetch(API_BASE + '/api/auth/register', {
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
  const calendarBtn = document.getElementById('calendarBtn');
  const profileLogoutBtn = document.getElementById('logoutProfileBtn');

  if (authToken) {
    authBtn.style.display = 'none';
    profileBtn.style.display = 'block';
    calendarBtn.style.display = 'block';
    if (profileLogoutBtn) profileLogoutBtn.style.display = 'block';
  } else {
    authBtn.style.display = 'block';
    profileBtn.style.display = 'none';
    calendarBtn.style.display = 'none';
    if (profileLogoutBtn) profileLogoutBtn.style.display = 'none';
  }

  // Ensure sender name input is visible for both guests and logged-in users
  const senderGroup = document.getElementById('senderNameGroup');
  const senderNameInput = document.getElementById('senderName');

  if (senderGroup) senderGroup.style.display = 'block';
  // Prefill name for logged-in users
  if (authToken && currentUser && senderNameInput) {
    senderNameInput.value = currentUser.username || '';
  } else if (senderNameInput) {
    // don't overwrite guest-entered names when not logged in
    // leave as-is (empty or previously entered)
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

  let sender_name = 'Anonymous';
  const message_text = document.getElementById('messageText').value;
  const birthdayDate = document.getElementById('birthdayDate').value;
  // Read the sender name input (prefilled for logged-in users)
  const nameEl = document.getElementById('senderName');
  if (nameEl) sender_name = nameEl.value.trim() || 'Anonymous';
  // Optional recipient username
  const recipient_username = (document.getElementById('recipientUsername') && document.getElementById('recipientUsername').value.trim()) || null;

  // Convert to MM-DD format (safer method to avoid timezone issues)
  const [year1, m1, d1] = birthdayDate.split('-');
  const target_birthday = `${m1}-${d1}`;

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(API_BASE + '/api/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify({ sender_name, message_text, target_birthday, recipient_username })
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

  // Convert to MM-DD format (safer method to avoid timezone issues)
  const [year2, m2, d2] = birthdayDate.split('-');
  const target_birthday = `${m2}-${d2}`;

  try {
    const response = await fetch(API_BASE + `/api/messages/${target_birthday}`);
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
          <div style="margin-top: 12px;">
            <button onclick="showCommentsModal('${msg._id}')" style="background: #667eea; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; font-size: 13px;">
              💬 Comments
            </button>
          </div>
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
    const response = await fetch(API_BASE + '/api/auth/profile', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();

    if (response.ok) {
      currentUser = data.user;
      updateAuthUI();
      displayProfile(data.user);
      // Load comments received on user's sent messages
      loadCommentsReceived();
    } else {
      logout();
    }
  } catch (error) {
    console.error('Failed to load profile:', error);
  }
}

// ========================================
// COMMENTS I RECEIVED (comments left on messages the user SENT)
// ========================================
async function loadCommentsReceived() {
  if (!authToken) return;

  try {
    const response = await fetch(API_BASE + '/api/comments/user/received', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();
    const container = document.getElementById('commentsReceived');

    if (!response.ok) {
      console.error('Failed to load comments received:', data.error);
      container.innerHTML = `<div style="color:#666;">Failed to load comments.</div>`;
      return;
    }

    if (!data.received || data.received.length === 0) {
        // Hide the entire section if there are no comments received
        const section = document.getElementById('commentsReceivedSection');
        if (section) section.style.display = 'none';
        container.innerHTML = '';
      return;
    }
      // Show section header
      const section = document.getElementById('commentsReceivedSection');
      if (section) section.style.display = 'block';

      // Render each message as a card with nested comment cards inside
      container.innerHTML = data.received.map(item => {
        const comments = item.comments || [];
        const commentsHtml = comments.map(c => `
          <div style="background:#f8fafc;padding:10px;border-radius:6px;border:1px solid #e5e7eb;margin-bottom:8px;margin-left:8px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <strong style="color:#111">${escapeHtml(c.commenter_name || 'Anonymous')}</strong>
              <small style="color:#6b7280">${new Date(c.created_at).toLocaleDateString()}</small>
            </div>
            <div style="margin-top:6px;color:#111">${escapeHtml(c.comment_text)}</div>
          </div>
        `).join('');

        return `
          <div style="background: #ffffff; border: 1px solid #e6e6e6; padding: 14px; border-radius: 8px; margin-bottom: 14px; box-shadow: 0 1px 2px rgba(0,0,0,0.03)">
            <div style="font-weight:600;color:#111;margin-bottom:8px;">Your message</div>
            <div style="color:#111;margin-bottom:8px;">${escapeHtml(item.message_text)}</div>
            <div style="color:#6b7280;font-size:13px;margin-bottom:8px;">Sent on: ${new Date(item.created_at).toLocaleDateString()}</div>
            <div style="margin-top:6px;">
              ${commentsHtml || '<div style="color:#6b7280">No comments</div>'}
            </div>
          </div>
        `;
      }).join('');

  } catch (err) {
    console.error('Error loading comments received:', err);
    const container = document.getElementById('commentsReceived');
    if (container) container.innerHTML = `<div style="color:#666;">Connection error. Please try again.</div>`;
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
    const sentResponse = await fetch(API_BASE + '/api/messages/user/sent', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const sentData = await sentResponse.json();

    // Load received messages
    const receivedResponse = await fetch(API_BASE + '/api/messages/user/received', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const receivedData = await receivedResponse.json();

    displaySentMessages(sentData);
    // Wait for received messages display (it will also fetch comments previews)
    await displayReceivedMessages(receivedData);
  } catch (error) {
    console.error('Failed to load user messages:', error);
  }
}

function displaySentMessages(data) {
  const container = document.getElementById('sentMessages');

  // Handle missing or malformed data
  const messages = data && data.messages ? data.messages : [];

  console.log('displaySentMessages: received messages count =', messages.length);
  try {
    console.log('displaySentMessages ids =', messages.map(m => (m && (m._id ? (m._id.toString ? m._id.toString() : m._id) : (m.id || null)))));
  } catch (e) {
    console.warn('displaySentMessages: failed to map ids', e);
  }

  if (!messages || messages.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">✉️</div>
        <p>You haven't sent any messages yet.</p>
      </div>
    `;
  } else {
    container.innerHTML = messages.map(msg => {
      // Ensure we have a usable id string for data attributes
      const safeId = (msg._id && msg._id.toString) ? msg._id.toString() : (msg.id ? msg.id : '');
      // Determine recipient display: prefer recipient_username provided by API, else show birthday
      const recipientDisplay = msg.recipient_username ? `${msg.recipient_username}` : `To: ${msg.target_birthday}`;
      // Store data in data attributes instead of inline onclick
      return `
        <div class="message-card">
          <div class="message-header">
            <span class="message-sender">${recipientDisplay}</span>
            <span class="message-date">${new Date(msg.created_at).toLocaleDateString()}</span>
          </div>
          <div class="message-text">${escapeHtml(msg.message_text)}</div>
          <div style="display: flex; gap: 10px; margin-top: 15px;">
            <button class="edit-msg-btn" data-msg-id="${safeId}" data-target-birthday="${msg.target_birthday}" data-msg-text="${escapeHtml(msg.message_text)}" style="flex: 1; padding: 8px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;">
              ✏️ Edit
            </button>
            <button class="delete-msg-btn" data-msg-id="${safeId}" style="flex: 1; padding: 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;">
              🗑️ Delete
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach event listeners
    document.querySelectorAll('.edit-msg-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const msgId = this.dataset.msgId;
        const targetBirthday = this.dataset.targetBirthday;
        const msgText = this.dataset.msgText;
        showEditMessageModal(msgId, targetBirthday, msgText);
      });
    });

    document.querySelectorAll('.delete-msg-btn').forEach(btn => {
      const id = btn.dataset.msgId;
      if (!id) {
        console.warn('Found delete button without id attribute', btn);
        btn.style.outline = '2px solid orange';
      }
      btn.addEventListener('click', function() {
        const msgId = this.dataset.msgId;
        console.log('delete button clicked for id=', msgId);
        showDeleteMessageModal(msgId);
      });
    });
  }
}

async function displayReceivedMessages(data) {
  const container = document.getElementById('receivedMessages');
  const messages = data && data.messages ? data.messages : [];

  if (!messages || messages.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🎁</div>
        <p>No birthday messages for you yet.</p>
      </div>
    `;
    return;
  }

  // Render message cards with a placeholder for comments preview
  container.innerHTML = messages.map(msg => {
    const safeId = (msg._id && msg._id.toString) ? msg._id.toString() : (msg.id ? msg.id : '');
    const created = new Date(msg.created_at).toLocaleDateString();

    return `
      <div class="message-card" id="received-msg-${safeId}">
        <div class="message-header">
          <span class="message-sender">${msg.sender_name === 'Anonymous' ? '🎭 Anonymous' : '👤 ' + msg.sender_name}</span>
          <span class="message-date">${created}</span>
        </div>
        <div class="message-text">${escapeHtml(msg.message_text)}</div>
        <div id="received-comments-${safeId}" style="margin-top:10px;">
          <small style="color:#666;">Loading comments...</small>
        </div>
        <div style="margin-top:8px;">
          <button onclick="showCommentsModal('${safeId}')" style="background:#6b7280;color:#fff;border:none;padding:6px 10px;border-radius:4px;cursor:pointer;font-size:12px;">
            View All Comments
          </button>
        </div>
      </div>
    `;
  }).join('');

  // For each message, fetch its comments and render a small preview
  for (const msg of messages) {
    const safeId = (msg._id && msg._id.toString) ? msg._id.toString() : (msg.id ? msg.id : '');
    const commentsContainer = document.getElementById(`received-comments-${safeId}`);
    if (!commentsContainer) continue;

    try {
      const resp = await fetch(API_BASE + `/api/comments/${safeId}`);
      const json = await resp.json();
      if (resp.ok && Array.isArray(json.comments)) {
        const comments = json.comments.slice(0, 2); // show up to 2 recent comments
        if (comments.length === 0) {
          commentsContainer.innerHTML = `<small style="color:#666;">No comments yet</small>`;
        } else {
          commentsContainer.innerHTML = comments.map(c => `
            <div style="background:#f3f4f6;padding:8px;border-radius:6px;margin-bottom:6px;">
              <strong style="color:#374151">${escapeHtml(c.commenter_name || 'Anonymous')}</strong>
              <span style="color:#6b7280;font-size:12px;margin-left:8px;">${new Date(c.created_at).toLocaleDateString()}</span>
              <div style="margin-top:6px;color:#111;font-size:14px;">${escapeHtml(c.comment_text)}</div>
            </div>
          `).join('');
          if (json.count > 2) {
            const more = document.createElement('div');
            more.innerHTML = `<small style="color:#6b7280;">${json.count - 2} more comment(s) — <a href="#" onclick="showCommentsModal('${safeId}');return false;">View all</a></small>`;
            commentsContainer.appendChild(more);
          }
        }
      } else {
        commentsContainer.innerHTML = `<small style="color:#666;">Failed to load comments</small>`;
      }
    } catch (err) {
      console.error('Failed to load comments for message', safeId, err);
      commentsContainer.innerHTML = `<small style="color:#666;">Failed to load comments</small>`;
    }
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

// ========================================
// DELETE ACCOUNT
// ========================================
function showDeleteAccountModal() {
  document.getElementById('deleteAccountModal').style.display = 'flex';
}

function closeDeleteAccountModal() {
  document.getElementById('deleteAccountModal').style.display = 'none';
}

async function confirmDeleteAccount() {
  showLoading();
  closeDeleteAccountModal();

  try {
    const response = await fetch(API_BASE + '/api/auth/profile', {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (response.ok) {
      showToast('Account deleted successfully. Goodbye! 👋', 'success');
      // Clear user data and redirect to home
      authToken = null;
      currentUser = null;
      localStorage.removeItem('token');
      updateAuthUI();
      showSection('home');
    } else {
      const data = await response.json();
      showToast(data.error || 'Failed to delete account', 'error');
    }
  } catch (error) {
    console.error('Delete account error:', error);
    showToast('Connection error. Please try again.', 'error');
  } finally {
    hideLoading();
  }
}

// ========================================
// EDIT & DELETE MESSAGES
// ========================================
let currentEditingMessageId = null;

function showEditMessageModal(messageId, targetBirthday, messageText) {
  currentEditingMessageId = messageId;
  document.getElementById('editMessageText').value = messageText;
  
  // Convert MM-DD to YYYY-MM-DD for date input
  const year = new Date().getFullYear();
  document.getElementById('editMessageBirthday').value = `${year}-${targetBirthday}`;
  
  // Update char count
  const charCount = messageText.length;
  document.getElementById('editCharCount').textContent = `${charCount} / 1000 characters`;
  
  document.getElementById('editMessageModal').style.display = 'flex';
}

function closeEditMessageModal() {
  currentEditingMessageId = null;
  document.getElementById('editMessageModal').style.display = 'none';
}

async function handleEditMessage(e) {
  e.preventDefault();
  showLoading();

  const messageText = document.getElementById('editMessageText').value.trim();
  const birthdayDate = document.getElementById('editMessageBirthday').value;

  if (!messageText) {
    showToast('Message cannot be empty', 'error');
    hideLoading();
    return;
  }

  // Convert to MM-DD format
  const date = new Date(birthdayDate);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const target_birthday = `${month}-${day}`;

  try {
    const response = await fetch(API_BASE + `/api/messages/${currentEditingMessageId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ message_text: messageText, target_birthday })
    });

    const data = await response.json();

    if (response.ok) {
      showToast('Message updated successfully! ✏️', 'success');
      closeEditMessageModal();
      loadUserMessages(); // Refresh the messages list
    } else {
      showToast(data.error || 'Failed to update message', 'error');
    }
  } catch (error) {
    console.error('Edit message error:', error);
    showToast('Connection error. Please try again.', 'error');
  } finally {
    hideLoading();
  }
}

let currentDeletingMessageId = null;

function showDeleteMessageModal(messageId) {
  // Validate the id early and refuse to open modal if invalid
  if (!messageId || messageId === 'null' || messageId === 'undefined') {
    console.error('showDeleteMessageModal called with invalid id:', messageId);
    showToast('Invalid message selected. Please try again.', 'error');
    return;
  }
  currentDeletingMessageId = messageId;
  document.getElementById('deleteMessageModal').style.display = 'flex';
}

function closeDeleteMessageModal() {
  currentDeletingMessageId = null;
  document.getElementById('deleteMessageModal').style.display = 'none';
}

async function confirmDeleteMessage() {
  // Capture the id BEFORE closing the modal (which clears the variable)
  const messageIdToDelete = currentDeletingMessageId;
  
  // Defensive check: ensure we have a valid id before calling API
  if (!messageIdToDelete || messageIdToDelete === 'null') {
    console.error('confirmDeleteMessage called with invalid id:', messageIdToDelete);
    closeDeleteMessageModal();
    showToast('Invalid message selected. Please try again.', 'error');
    return;
  }
  
  showLoading();
  closeDeleteMessageModal();

  try {
    console.log('Deleting message id:', messageIdToDelete);
    const response = await fetch(API_BASE + `/api/messages/${messageIdToDelete}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (response.ok) {
      showToast('Message deleted successfully! 🗑️', 'success');
      loadUserMessages(); // Refresh the messages list
    } else {
      const data = await response.json();
      showToast(data.error || 'Failed to delete message', 'error');
    }
  } catch (error) {
    console.error('Delete message error:', error);
    showToast('Connection error. Please try again.', 'error');
  } finally {
    hideLoading();
  }
}

// ========================================
// EDIT PROFILE
// ========================================
function showEditProfileModal() {
  // Pre-fill the form with current user data
  if (currentUser) {
    document.getElementById('editUsername').value = currentUser.username || '';
    document.getElementById('editBirthday').value = convertBirthdayToDateInput(currentUser.birthday_date) || '';
  }
  document.getElementById('editProfileModal').style.display = 'flex';
}

function closeEditProfileModal() {
  document.getElementById('editProfileModal').style.display = 'none';
}

// Convert MM-DD format to YYYY-MM-DD for date input (use current year)
function convertBirthdayToDateInput(birthdayMmDd) {
  if (!birthdayMmDd || !birthdayMmDd.includes('-')) return '';
  const [month, day] = birthdayMmDd.split('-');
  const year = new Date().getFullYear();
  return `${year}-${month}-${day}`;
}

async function handleEditProfile(e) {
  e.preventDefault();
  showLoading();

  const username = document.getElementById('editUsername').value.trim();
  const birthdayDate = document.getElementById('editBirthday').value;

  // Convert birthday back to MM-DD format
  let birthday_date = null;
  if (birthdayDate) {
    const date = new Date(birthdayDate);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    birthday_date = `${month}-${day}`;
  }

  try {
    const payload = {};
    if (username) payload.username = username;
    if (birthday_date) payload.birthday_date = birthday_date;

    if (Object.keys(payload).length === 0) {
      showToast('Please fill in at least one field', 'error');
      hideLoading();
      return;
    }

    const response = await fetch(API_BASE + '/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (response.ok) {
      currentUser = data.user;
      showToast('Profile updated successfully! 🎉', 'success');
      displayProfile(currentUser);
      closeEditProfileModal();
    } else {
      showToast(data.error || 'Failed to update profile', 'error');
    }
  } catch (error) {
    console.error('Edit profile error:', error);
    showToast('Connection error. Please try again.', 'error');
  } finally {
    hideLoading();
  }
}

// ========================================
// BIRTHDAY CALENDAR CRUD
// ========================================
let currentEditingBirthdayId = null;
let currentDeletingBirthdayId = null;

function showAddBirthdayModal() {
  currentEditingBirthdayId = null;
  document.getElementById('birthdayModalTitle').textContent = '➕ Add Birthday Reminder';
  document.getElementById('birthdayForm').reset();
  document.getElementById('birthdayDescCount').textContent = '0 / 500 characters';
  document.getElementById('birthdayModal').style.display = 'flex';
}

function closeBirthdayModal() {
  currentEditingBirthdayId = null;
  document.getElementById('birthdayModal').style.display = 'none';
}

function closeBirthdayDeleteModal() {
  currentDeletingBirthdayId = null;
  document.getElementById('deleteBirthdayModal').style.display = 'none';
}


async function handleBirthdaySubmit(e) {
  e.preventDefault();
  showLoading();

  const name = document.getElementById('birthdayName').value.trim();
  const birthdayDate = document.getElementById('birthdayDate').value;
  const description = document.getElementById('birthdayDesc').value.trim();
  const reminder_enabled = document.getElementById('birthdayReminder').checked;

  // Send 'date' as YYYY-MM-DD for backend normalization
  try {
    const payload = { name, date: birthdayDate, description, reminder_enabled };
    let url = API_BASE + '/api/birthdays';
    let method = 'POST';

    if (currentEditingBirthdayId) {
      url += `/${currentEditingBirthdayId}`;
      method = 'PUT';
    }

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (response.ok) {
      const message = currentEditingBirthdayId ? 'Birthday updated successfully! ✏️' : 'Birthday reminder added! 📅';
      showToast(message, 'success');
      closeBirthdayModal();
      loadBirthdayCalendar();
    } else {
      showToast(data.error || 'Failed to save birthday', 'error');
    }
  } catch (error) {
    console.error('Birthday submit error:', error);
    showToast('Connection error. Please try again.', 'error');
  } finally {
    hideLoading();
  }
}

async function loadBirthdayCalendar() {
  if (!authToken) return;

  try {
    const response = await fetch(API_BASE + '/api/birthdays', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();

    if (response.ok) {
      displayBirthdayCalendar(data.birthdays);
    } else {
      console.error('Failed to load birthdays:', data.error);
    }
  } catch (error) {
    console.error('Failed to load birthday calendar:', error);
  }
}

function displayBirthdayCalendar(birthdays) {
  const container = document.getElementById('birthdaysList');

  if (!birthdays || birthdays.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📅</div>
        <p>No birthday reminders yet.</p>
        <p>Click "Add Birthday Reminder" to get started!</p>
      </div>
    `;
    return;
  }

  // Defensive: filter out null/undefined
  const validBirthdays = (birthdays || []).filter(b => b && (b.birthday_date || b.date));
  // Sort by MM-DD
  const sortedBirthdays = [...validBirthdays].sort((a, b) => {
    // Use birthday_date if available, else fallback to MM-DD from date
    const getMMDD = obj => {
      if (obj.birthday_date) return obj.birthday_date;
      if (obj.date) {
        const d = new Date(obj.date);
        return `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      }
      return '00-00';
    };
    const [aMonth, aDay] = getMMDD(a).split('-');
    const [bMonth, bDay] = getMMDD(b).split('-');
    const aDate = parseInt(aMonth + aDay);
    const bDate = parseInt(bMonth + bDay);
    return aDate - bDate;
  });

  container.innerHTML = `
    <div style="display: grid; gap: 15px;">
      ${sortedBirthdays.map(birthday => {
        const createdDate = new Date(birthday.createdAt || birthday.created_at).toLocaleDateString();
        // Use birthday_date if available, else fallback to MM-DD from date
        let mmdd = birthday.birthday_date;
        if (!mmdd && birthday.date) {
          const d = new Date(birthday.date);
          mmdd = `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        }
        const [month, day] = mmdd ? mmdd.split('-') : ['00','00'];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const dateDisplay = `${monthNames[parseInt(month) - 1] || '??'} ${parseInt(day)}`;
        return `
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
              <div>
                <h4 style="margin: 0 0 5px 0; font-size: 18px;"> ${escapeHtml(birthday.name)}</h4>
                <p style="margin: 0; font-size: 14px; opacity: 0.9;"> ${dateDisplay}</p>
              </div>
              <div style="display: flex; gap: 8px;">
                <button onclick="showEditBirthdayModal('${birthday._id}')" style="background: #4CAF50; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; font-weight: bold;">
                  ✏️
                </button>
                <button onclick="showDeleteBirthdayModal('${birthday._id}')" style="background: #dc3545; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; font-weight: bold;">
                  🗑️
                </button>
              </div>
            </div>
            ${birthday.description ? `<p style=\"margin: 10px 0 0 0; font-size: 14px; opacity: 0.95;\">${escapeHtml(birthday.description)}</p>` : ''}
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 13px; opacity: 0.8;">
              ${(birthday.reminder_enabled !== false ? '🔔 Reminder enabled' : '🔕 Reminder disabled')} • Added ${createdDate}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

async function showEditBirthdayModal(birthdayId) {
  if (!birthdayId) {
    showToast('Invalid birthday selected', 'error');
    return;
  }

  try {
    const response = await fetch(API_BASE + '/api/birthdays', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();

    if (response.ok) {
      const birthday = data.birthdays.find(b => b._id === birthdayId);
      
      if (birthday) {
        currentEditingBirthdayId = birthdayId;
        document.getElementById('birthdayModalTitle').textContent = ' Edit Birthday Reminder';
        document.getElementById('birthdayName').value = birthday.name || '';

        // Description may be undefined
        const desc = birthday.description || '';
        document.getElementById('birthdayDesc').value = desc;
        document.getElementById('birthdayDescCount').textContent = `${desc.length} / 500 characters`;

        // reminder_enabled may be undefined in older records; default to true
        const reminderFlag = typeof birthday.reminder_enabled === 'boolean' ? birthday.reminder_enabled : true;
        document.getElementById('birthdayReminder').checked = reminderFlag;

        // Determine date: prefer birthday_date (MM-DD), else fallback to date field
        let mmdd = birthday.birthday_date;
        if (!mmdd && birthday.date) {
          const d = new Date(birthday.date);
          mmdd = `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        }
        if (mmdd) {
          const [month, day] = mmdd.split('-');
          const year = new Date().getFullYear();
          document.getElementById('birthdayDateModal').value = `${year}-${month}-${day}`;
        } else {
          document.getElementById('birthdayDateModal').value = '';
        }

        document.getElementById('birthdayModal').style.display = 'flex';
      } else {
        showToast('Birthday not found', 'error');
      }
    } else {
      showToast('Failed to load birthday details', 'error');
    }
  } catch (error) {
    console.error('Error loading birthday:', error);
    showToast('Connection error. Please try again.', 'error');
  }
}

function showDeleteBirthdayModal(birthdayId) {
  if (!birthdayId || birthdayId === 'null') {
    showToast('Invalid birthday selected', 'error');
    return;
  }
  currentDeletingBirthdayId = birthdayId;
  document.getElementById('deleteBirthdayModal').style.display = 'flex';
}

async function confirmDeleteBirthday() {
    // Capture the ID before clearing the state
    const birthdayIdToDelete = currentDeletingBirthdayId; 

    if (!birthdayIdToDelete || birthdayIdToDelete === 'null') {
        closeBirthdayDeleteModal();
        showToast('Invalid birthday selected', 'error');
        return;
    }
    
    showLoading();
    closeBirthdayDeleteModal(); // Tutup modal

    try {
        const response = await fetch(API_BASE + `/api/birthdays/${birthdayIdToDelete}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            showToast('Birthday reminder deleted! 🗑️', 'success');
            loadBirthdayCalendar(); // Refresh list
        } else {
            const data = await response.json();
            showToast(data.error || 'Failed to delete birthday', 'error');
        }
    } catch (error) {
        console.error('Delete birthday error:', error);
        showToast('Connection error. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

// ========================================
// COMMENTS (NEW: CRUD for message comments)
// ========================================
let currentCommentingMessageId = null;
let currentEditingCommentId = null;
let currentDeletingCommentId = null;

function showCommentsModal(messageId) {
  currentCommentingMessageId = messageId;
  document.getElementById('commentModalTitle').textContent = `💬 Comments on this message`;
  document.getElementById('commentForm').reset();
  document.getElementById('commentText').value = '';
  document.getElementById('commentCharCount').textContent = '0 / 500 characters';
  document.getElementById('commentModal').style.display = 'flex';
  loadCommentsForMessage(messageId);
}

function closeCommentModal() {
  currentCommentingMessageId = null;
  document.getElementById('commentModal').style.display = 'none';
}

async function loadCommentsForMessage(messageId) {
  try {
    const response = await fetch(API_BASE + `/api/comments/${messageId}`);
    const data = await response.json();

    if (response.ok) {
      displayComments(data.comments);
    } else {
      console.error('Failed to load comments:', data.error);
    }
  } catch (error) {
    console.error('Error loading comments:', error);
  }
}

function displayComments(comments) {
  const container = document.getElementById('commentsList');

  if (!comments || comments.length === 0) {
    container.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #999;">
        <p>No comments yet. Be the first to comment!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = comments.map(comment => {
    const createdDate = new Date(comment.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return `
      <div style="background: #f9fafb; border-left: 4px solid #667eea; padding: 12px; margin-bottom: 12px; border-radius: 4px;">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
          <div>
            <strong style="color: #667eea;">${escapeHtml(comment.commenter_name)}</strong>
            <span style="color: #999; font-size: 12px; margin-left: 8px;">${createdDate}</span>
          </div>
          <div style="display: flex; gap: 5px;">
            <button onclick="showEditCommentModal('${comment._id}', '${escapeHtml(comment.comment_text).replace(/'/g, "\\'")}', '${currentCommentingMessageId}')" style="background: #4CAF50; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 11px;">
              ✏️
            </button>
            <button onclick="showDeleteCommentModal('${comment._id}')" style="background: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 11px;">
              🗑️
            </button>
          </div>
        </div>
        <p style="margin: 0; color: #333; font-size: 14px; line-height: 1.5;">${escapeHtml(comment.comment_text)}</p>
      </div>
    `;
  }).join('');
}

async function handleAddComment(e) {
  e.preventDefault();
  showLoading();

  const commenter_name = document.getElementById('commentName').value || 'Anonymous';
  const comment_text = document.getElementById('commentText').value.trim();
  const message_id = currentCommentingMessageId;

  if (!comment_text) {
    showToast('Comment cannot be empty', 'error');
    hideLoading();
    return;
  }

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    let response;
    // If editing an existing comment, perform PUT; otherwise POST a new comment
    if (currentEditingCommentId) {
      response = await fetch(API_BASE + `/api/comments/${currentEditingCommentId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ comment_text })
      });
    } else {
      response = await fetch(API_BASE + '/api/comments', {
        method: 'POST',
        headers,
        body: JSON.stringify({ message_id, commenter_name, comment_text })
      });
    }

    const data = await response.json();

    if (response.ok) {
      const successMsg = currentEditingCommentId ? 'Comment updated! ✏️' : 'Comment posted! 💬';
      showToast(successMsg, 'success');
      document.getElementById('commentForm').reset();
      // Clear edit state
      currentEditingCommentId = null;
      loadCommentsForMessage(message_id);
      // Refresh "Comments I Received" (in case the current user is the message owner)
      try { loadCommentsReceived(); } catch (e) { /* ignore */ }
    } else {
      showToast(data.error || (currentEditingCommentId ? 'Failed to update comment' : 'Failed to post comment'), 'error');
    }
  } catch (error) {
    console.error('Comment submit error:', error);
    showToast('Connection error. Please try again.', 'error');
  } finally {
    hideLoading();
  }
}

function showEditCommentModal(commentId, commentText, messageId) {
  currentEditingCommentId = commentId;
  document.getElementById('commentText').value = commentText;
  document.getElementById('commentCharCount').textContent = `${commentText.length} / 500 characters`;
  // Note: we could show edit mode UI here, but for simplicity we just reload after edit
}

async function saveEditComment() {
  if (!currentEditingCommentId) return;

  showLoading();
  const comment_text = document.getElementById('commentText').value.trim();

  if (!comment_text) {
    showToast('Comment cannot be empty', 'error');
    hideLoading();
    return;
  }

  try {
    const response = await fetch(API_BASE + `/api/comments/${currentEditingCommentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ comment_text })
    });

    const data = await response.json();

    if (response.ok) {
      showToast('Comment updated! ✏️', 'success');
      currentEditingCommentId = null;
      loadCommentsForMessage(currentCommentingMessageId);
    } else {
      showToast(data.error || 'Failed to update comment', 'error');
    }
  } catch (error) {
    console.error('Edit comment error:', error);
    showToast('Connection error. Please try again.', 'error');
  } finally {
    hideLoading();
  }
}

let currentDeletingCommentForMessage = null;

function showDeleteCommentModal(commentId) {
  currentDeletingCommentId = commentId;
  currentDeletingCommentForMessage = currentCommentingMessageId;
  if (confirm('Are you sure you want to delete this comment?')) {
    confirmDeleteComment();
  }
}

async function confirmDeleteComment() {
  if (!currentDeletingCommentId) return;

  showLoading();

  try {
    const response = await fetch(API_BASE + `/api/comments/${currentDeletingCommentId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (response.ok) {
      showToast('Comment deleted! 🗑️', 'success');
      loadCommentsForMessage(currentDeletingCommentForMessage);
    } else {
      const data = await response.json();
      showToast(data.error || 'Failed to delete comment', 'error');
    }
  } catch (error) {
    console.error('Delete comment error:', error);
    showToast('Connection error. Please try again.', 'error');
  } finally {
    currentDeletingCommentId = null;
    hideLoading();
  }
}
