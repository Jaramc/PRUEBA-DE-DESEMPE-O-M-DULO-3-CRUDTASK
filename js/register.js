document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    console.log('Registration form submitted');
    
    const fullName = document.getElementById('fullName').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    console.log('Registration data:', { fullName, email });
    
    if (!fullName || !email || !password || !confirmPassword) {
        console.log('Validation failed: empty fields');
        alert('Please fill all fields');
        return;
    }
    
    console.log('Validating passwords...');
    if (password !== confirmPassword) {
        console.log('Passwords do not match');
        alert('Passwords do not match');
        return;
    }
    
    if (password.length < 6) {
        console.log('Password too short:', password.length);
        alert('Password must be at least 6 characters');
        return;
    }
    
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Registering...';
    submitBtn.disabled = true;
    
    console.log('Sending registration request...');
    try {
        const userData = { fullName, email, password };
        const newUser = await registerUser(userData);
        console.log('User registered:', newUser);
        
        if (newUser) {
            console.log('Registration successful, redirecting to login');
            alert('Registration successful! You can now sign in');
            window.location.href = 'index.html';
        } else {
            console.log('Error registering: empty response');
            alert('Error registering user');
        }
    } catch (error) {
        console.error('Error in registration:', error);
        alert('Error connecting to server. Please verify that JSON Server is running.');
    }
    
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
});