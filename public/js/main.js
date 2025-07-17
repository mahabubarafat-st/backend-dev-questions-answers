// DOM Elements
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const navLinks = document.getElementById('nav-links');
const authToken = localStorage.getItem('authToken');
const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');

// Toggle mobile menu
if (mobileMenuBtn && navLinks) {
  mobileMenuBtn.addEventListener('click', () => {
    navLinks.classList.toggle('active');
  });
}

// Check if user is logged in
function isLoggedIn() {
  return !!authToken;
}

// Update navigation based on auth status
function updateNavigation() {
  const authNav = document.getElementById('auth-nav');
  const userNav = document.getElementById('user-nav');
  const userNameElement = document.getElementById('user-name');
  
  if (authNav && userNav) {
    if (isLoggedIn()) {
      authNav.classList.add('hidden');
      userNav.classList.remove('hidden');
      
      if (userNameElement && userInfo.name) {
        userNameElement.textContent = userInfo.name;
      }
      
      // Show admin link if user is admin
      const adminLink = document.getElementById('admin-link');
      if (adminLink && userInfo.role === 'admin') {
        adminLink.classList.remove('hidden');
      }
    } else {
      authNav.classList.remove('hidden');
      userNav.classList.add('hidden');
    }
  }
}

// Handle logout
function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userInfo');
  window.location.href = '/';
}

// Set up logout button
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    logout();
  });
}

// API Functions
const API_URL = '/api';

// Generic fetch function with auth
async function fetchAPI(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Something went wrong');
  }
  
  return response.json();
}

// Auth functions
async function register(userData) {
  try {
    const data = await fetchAPI('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('userInfo', JSON.stringify(data.user));
    
    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

async function login(credentials) {
  try {
    const data = await fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('userInfo', JSON.stringify(data.user));
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

// Course functions
async function getCourseOverview() {
  try {
    return await fetchAPI('/courses/overview');
  } catch (error) {
    console.error('Course overview error:', error);
    throw error;
  }
}

async function getCourseContent() {
  try {
    return await fetchAPI('/courses/content');
  } catch (error) {
    console.error('Course content error:', error);
    throw error;
  }
}

async function getSection(sectionId) {
  try {
    return await fetchAPI(`/courses/section/${sectionId}`);
  } catch (error) {
    console.error('Section error:', error);
    throw error;
  }
}

async function getQuestion(sectionId, questionId) {
  try {
    return await fetchAPI(`/courses/question/${sectionId}/${questionId}`);
  } catch (error) {
    console.error('Question error:', error);
    throw error;
  }
}

// Payment functions
async function createPaymentIntent() {
  try {
    return await fetchAPI('/payments/create-payment-intent', {
      method: 'POST'
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    throw error;
  }
}

async function confirmSubscription(paymentIntentId) {
  try {
    return await fetchAPI('/payments/confirm-subscription', {
      method: 'POST',
      body: JSON.stringify({ paymentIntentId })
    });
  } catch (error) {
    console.error('Subscription confirmation error:', error);
    throw error;
  }
}

async function getTransactions() {
  try {
    return await fetchAPI('/payments/transactions');
  } catch (error) {
    console.error('Transactions error:', error);
    throw error;
  }
}

// Progress tracking
async function updateProgress(sectionId, questionId) {
  try {
    return await fetchAPI('/auth/progress', {
      method: 'POST',
      body: JSON.stringify({ sectionId, questionId })
    });
  } catch (error) {
    console.error('Progress update error:', error);
    throw error;
  }
}

// Admin functions
async function getAdminStats() {
  try {
    return await fetchAPI('/admin/stats');
  } catch (error) {
    console.error('Admin stats error:', error);
    throw error;
  }
}

async function getAdminUsers() {
  try {
    return await fetchAPI('/admin/users');
  } catch (error) {
    console.error('Admin users error:', error);
    throw error;
  }
}

async function getAdminCourse() {
  try {
    return await fetchAPI('/admin/course');
  } catch (error) {
    console.error('Admin course error:', error);
    throw error;
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  updateNavigation();
  
  // Handle auth forms
  const registerForm = document.getElementById('register-form');
  const loginForm = document.getElementById('login-form');
  
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('register-name').value;
      const email = document.getElementById('register-email').value;
      const password = document.getElementById('register-password').value;
      
      try {
        await register({ name, email, password });
        window.location.href = '/dashboard.html';
      } catch (error) {
        showAlert('register-alert', error.message, 'danger');
      }
    });
  }
  
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      
      try {
        await login({ email, password });
        window.location.href = '/dashboard.html';
      } catch (error) {
        showAlert('login-alert', error.message, 'danger');
      }
    });
  }
  
  // Handle payment form
  const paymentForm = document.getElementById('payment-form');
  if (paymentForm) {
    initializeStripe();
  }
  
  // Load course content if on dashboard
  const courseContent = document.getElementById('course-content');
  if (courseContent) {
    loadCourseContent();
  }
  
  // Load admin dashboard if on admin page
  const adminDashboard = document.getElementById('admin-dashboard');
  if (adminDashboard) {
    loadAdminDashboard();
  }
});

// Helper functions
function showAlert(elementId, message, type = 'info') {
  const alertElement = document.getElementById(elementId);
  if (alertElement) {
    alertElement.textContent = message;
    alertElement.className = `alert alert-${type}`;
    alertElement.classList.remove('hidden');
    
    // Hide after 5 seconds
    setTimeout(() => {
      alertElement.classList.add('hidden');
    }, 5000);
  }
}

// Stripe integration
function initializeStripe() {
  if (!window.Stripe) {
    console.error('Stripe.js not loaded');
    return;
  }
  
  const stripe = Stripe('pk_test_your_publishable_key');
  const elements = stripe.elements();
  
  // Create card element
  const card = elements.create('card');
  card.mount('#card-element');
  
  // Handle form submission
  const paymentForm = document.getElementById('payment-form');
  const payButton = document.getElementById('pay-button');
  
  paymentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Disable button to prevent multiple clicks
    payButton.disabled = true;
    payButton.textContent = 'Processing...';
    
    try {
      // Create payment intent
      const { clientSecret, paymentIntentId } = await createPaymentIntent();
      
      // Confirm card payment
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: card,
          billing_details: {
            name: userInfo.name,
            email: userInfo.email
          }
        }
      });
      
      if (result.error) {
        throw new Error(result.error.message);
      }
      
      // Confirm subscription on server
      await confirmSubscription(paymentIntentId);
      
      // Update user info in local storage
      const updatedUserInfo = { ...userInfo, subscription: 'premium' };
      localStorage.setItem('userInfo', JSON.stringify(updatedUserInfo));
      
      // Show success message and redirect
      showAlert('payment-alert', 'Payment successful! You now have premium access.', 'success');
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 2000);
    } catch (error) {
      showAlert('payment-alert', error.message, 'danger');
      payButton.disabled = false;
      payButton.textContent = 'Pay $5';
    }
  });
}

// Load course content
async function loadCourseContent() {
  try {
    const courseContent = document.getElementById('course-content');
    if (!courseContent) return;
    
    const data = await getCourseContent();
    
    // Clear existing content
    courseContent.innerHTML = '';
    
    // Create sections
    data.sections.forEach(section => {
      const sectionElement = document.createElement('div');
      sectionElement.className = 'course-section';
      
      const sectionHeader = document.createElement('div');
      sectionHeader.className = 'section-header';
      sectionHeader.innerHTML = `
        <h2>${section.title}</h2>
        <span>${section.availableQuestions}/${section.totalQuestions} questions available</span>
      `;
      
      const questionList = document.createElement('ul');
      questionList.className = 'question-list';
      
      section.questions.forEach(question => {
        const questionItem = document.createElement('li');
        questionItem.className = 'question-item';
        
        const questionHeader = document.createElement('div');
        questionHeader.className = 'question-header';
        questionHeader.innerHTML = `
          <h3 class="question-title">${question.title}</h3>
          <span class="question-badge badge-${question.isFree ? 'free' : 'premium'}">${question.isFree ? 'Free' : 'Premium'}</span>
        `;
        
        const questionLink = document.createElement('a');
        questionLink.href = `/question.html?section=${section.id}&question=${question.id}`;
        questionLink.className = 'btn btn-sm';
        questionLink.textContent = 'View Question';
        
        questionItem.appendChild(questionHeader);
        questionItem.appendChild(questionLink);
        questionList.appendChild(questionItem);
      });
      
      sectionElement.appendChild(sectionHeader);
      sectionElement.appendChild(questionList);
      courseContent.appendChild(sectionElement);
    });
    
    // Show subscription status
    const subscriptionStatus = document.getElementById('subscription-status');
    if (subscriptionStatus) {
      subscriptionStatus.textContent = data.userSubscription === 'premium' ? 'Premium' : 'Free';
      subscriptionStatus.className = data.userSubscription === 'premium' ? 'badge-premium' : 'badge-free';
    }
    
    // Show upgrade button if not premium
    const upgradeBtn = document.getElementById('upgrade-btn');
    if (upgradeBtn) {
      if (data.userSubscription === 'premium') {
        upgradeBtn.classList.add('hidden');
      } else {
        upgradeBtn.classList.remove('hidden');
      }
    }
  } catch (error) {
    console.error('Error loading course content:', error);
    showAlert('dashboard-alert', 'Error loading course content', 'danger');
  }
}

// Load admin dashboard
async function loadAdminDashboard() {
  try {
    const stats = await getAdminStats();
    
    // Update stats cards
    document.getElementById('total-users').textContent = stats.userStats.total;
    document.getElementById('premium-users').textContent = stats.userStats.premium;
    document.getElementById('conversion-rate').textContent = `${stats.userStats.conversionRate}%`;
    document.getElementById('total-revenue').textContent = `$${stats.financialStats.revenue}`;
    
    // Load recent transactions
    const transactionsTable = document.getElementById('recent-transactions');
    if (transactionsTable) {
      transactionsTable.innerHTML = '';
      
      stats.recentTransactions.forEach(transaction => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${transaction.userId.name}</td>
          <td>${transaction.userId.email}</td>
          <td>$${transaction.amount}</td>
          <td>${transaction.status}</td>
          <td>${new Date(transaction.createdAt).toLocaleDateString()}</td>
        `;
        transactionsTable.appendChild(row);
      });
    }
    
    // Load recent users
    const usersTable = document.getElementById('recent-users');
    if (usersTable) {
      usersTable.innerHTML = '';
      
      stats.recentUsers.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${user.name}</td>
          <td>${user.email}</td>
          <td>${user.subscription}</td>
          <td>${new Date(user.createdAt).toLocaleDateString()}</td>
        `;
        usersTable.appendChild(row);
      });
    }
  } catch (error) {
    console.error('Error loading admin dashboard:', error);
    showAlert('admin-alert', 'Error loading admin dashboard', 'danger');
  }
}