document.getElementById('togglePassword').addEventListener('click', function() {
    const passwordField = document.getElementById('password');
    const eyeIcon = document.getElementById('eyeIcon');
    
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        eyeIcon.className = 'bi bi-eye-slash';
    } else {
        passwordField.type = 'password';
        eyeIcon.className = 'bi bi-eye';
    }
});

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    console.log('Login form submitted');
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    console.log('Email:', email);
    
    if (!email || !password) {
        console.log('Validation failed: empty fields');
        alert('Please fill all fields');
        return;
    }
    
    console.log('Validation OK, starting request...');
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Signing in...';
    submitBtn.disabled = true;
    
    try {
        const user = await loginUser(email, password);
        console.log('Login response:', user);
        
        if (user) {
            saveSession(user);
            console.log('Session saved, redirecting...');
            alert(`Welcome ${user.fullName}!`);
            
            if (user.role === 'admin') {
                console.log('Redirecting to admin dashboard');
                window.location.href = 'admin-dashboard.html';
            } else {
                console.log('Redirecting to user dashboard');
                window.location.href = 'user-dashboard.html';
            }
        } else {
            console.log('Invalid credentials');
            alert('Incorrect email or password');
        }
    } catch (error) {
        console.error('Error in login:', error);
        alert('Error connecting to server. Please verify that JSON Server is running.');
    }
    
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
});