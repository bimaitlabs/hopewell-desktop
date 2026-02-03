// Account selector logic
const accountsList = document.getElementById('accounts-list');
const addAccountBtn = document.getElementById('add-account-btn');

// Load saved accounts from localStorage
function loadAccounts() {
  const accounts = JSON.parse(localStorage.getItem('hopewell_saved_accounts') || '[]');
  
  if (accounts.length === 0) {
    showEmptyState();
  } else {
    renderAccounts(accounts);
  }
}

// Show empty state when no accounts
function showEmptyState() {
  accountsList.innerHTML = `
    <div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <p>No saved accounts yet.<br>Click "Add New Account" to get started.</p>
    </div>
  `;
}

// Render accounts list
function renderAccounts(accounts) {
  accountsList.innerHTML = accounts.map((account, index) => `
    <div class="account-card" data-index="${index}">
      <div class="account-avatar">${getInitials(account.name || account.email)}</div>
      <div class="account-info">
        <div class="account-name">${account.name || 'User'}</div>
        <div class="account-email">${account.email}</div>
      </div>
      <div class="account-actions">
        <button class="icon-btn delete" data-index="${index}" title="Remove account">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  `).join('');

  // Add click handlers
  document.querySelectorAll('.account-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.icon-btn')) {
        selectAccount(parseInt(card.dataset.index));
      }
    });
  });

  // Add delete handlers
  document.querySelectorAll('.icon-btn.delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteAccount(parseInt(btn.dataset.index));
    });
  });
}

// Get initials from name or email
function getInitials(text) {
  if (!text) return '?';
  const parts = text.split(/[\s@]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return text.substring(0, 2).toUpperCase();
}

// Select an account
function selectAccount(index) {
  const accounts = JSON.parse(localStorage.getItem('hopewell_saved_accounts') || '[]');
  const account = accounts[index];
  
  if (account) {
    // Store selected account
    localStorage.setItem('hopewell_selected_account', JSON.stringify(account));
    
    // Send message to main process to load the app
    if (window.electronAPI && window.electronAPI.selectAccount) {
      window.electronAPI.selectAccount(account);
    } else {
      // Fallback: just close the selector window
      window.close();
    }
  }
}

// Delete an account
function deleteAccount(index) {
  if (confirm('Are you sure you want to remove this account?')) {
    const accounts = JSON.parse(localStorage.getItem('hopewell_saved_accounts') || '[]');
    accounts.splice(index, 1);
    localStorage.setItem('hopewell_saved_accounts', JSON.stringify(accounts));
    loadAccounts();
  }
}

// Add new account
addAccountBtn.addEventListener('click', () => {
  // Clear selected account and load main app
  localStorage.removeItem('hopewell_selected_account');
  
  if (window.electronAPI && window.electronAPI.addNewAccount) {
    window.electronAPI.addNewAccount();
  } else {
    window.close();
  }
});

// Load accounts on page load
loadAccounts();
