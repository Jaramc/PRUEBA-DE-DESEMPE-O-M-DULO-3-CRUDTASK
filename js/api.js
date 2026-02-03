const API_URL = 'http://localhost:3000';

async function loginUser(email, password) {
    console.log('Attempting login with:', email);
    try {
        const response = await fetch(`${API_URL}/users?email=${email}`);
        const users = await response.json();
        console.log('Users found:', users.length);
        
        if (users.length > 0 && users[0].password === password) {
            console.log('Password correct, login successful');
            return users[0];
        }
        console.log('User not found or incorrect password');
        return null;
    } catch (error) {
        console.error('Error connecting to server:', error);
        return null;
    }
}

async function registerUser(userData) {
    console.log('Registering user:', userData.email);
    try {
        const newUser = {
            fullName: userData.fullName,
            email: userData.email,
            password: userData.password,
            role: 'user'
        };
        
        console.log('Sending POST to /users');
        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newUser)
        });
        
        console.log('Server response:', response.status);
        return await response.json();
    } catch (error) {
        console.error('Error registering user:', error);
        return null;
    }
}

function saveSession(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
}

function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

function checkSession() {
    const user = getCurrentUser();
    if (user) {
        if (user.role === 'admin') {
            window.location.href = 'admin-dashboard.html';
        } else {
            window.location.href = 'user-dashboard.html';
        }
    }
}

function updateAllAvatars() {
    const user = getCurrentUser();
    
    if (!user) return;
    
    const avatarElements = document.querySelectorAll('.user-avatar-placeholder, #profileAvatar');
    
    avatarElements.forEach(element => {
        if (user.avatar) {
            element.innerHTML = `<img src="${user.avatar}" alt="Profile Picture" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        } else {
            element.innerHTML = '<i class="bi bi-person-fill"></i>';
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateAllAvatars);
} else {
    updateAllAvatars();
}