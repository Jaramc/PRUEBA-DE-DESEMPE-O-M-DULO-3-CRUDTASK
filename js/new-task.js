document.addEventListener('DOMContentLoaded', function() {
    const user = getCurrentUser();
    console.log('New-task page loaded, user:', user);
    
    if (!user) {
        console.log('No session, redirecting to login');
        window.location.href = 'index.html';
        return;
    }
    
    document.getElementById('userName').textContent = user.fullName;
    
    const roleElement = document.getElementById('userRole');
    if (user.role === 'admin') {
        roleElement.textContent = 'Admin';
    } else {
        roleElement.textContent = 'Student';
    }
});

document.getElementById('createTaskForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    console.log('Create task form submitted');
    
    const user = getCurrentUser();
    
    const taskData = {
        title: document.getElementById('taskTitle').value.trim(),
        category: document.getElementById('taskCategory').value,
        priority: document.getElementById('taskPriority').value,
        status: document.getElementById('taskStatus').value,
        dueDate: document.getElementById('taskDueDate').value || null,
        description: document.getElementById('taskDescription').value.trim(),
        userId: user.id,
        createdAt: new Date().toISOString()
    };
    
    if (!taskData.title) {
        console.log('Validation failed: empty title');
        alert('Please enter a title for the task');
        document.getElementById('taskTitle').focus();
        return;
    }
    
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="bi bi-hourglass"></i> Saving...';
    submitBtn.disabled = true;
    
    console.log('Sending task:', taskData);
    try {
        const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(taskData)
        });
        
        if (response.ok) {
            console.log('Task created successfully');
            if (user.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'user-dashboard.html';
            }
        } else {
            console.log('Error in response:', response.status);
            throw new Error('Error creating task');
        }
    } catch (error) {
        alert('Error creating task. Please try again.');
        console.error('Error:', error);
        
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});