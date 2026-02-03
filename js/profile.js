document.addEventListener('DOMContentLoaded', function() {
    const user = getCurrentUser();
    console.log('Profile loaded, user:', user);
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    loadProfileData(user);
    loadUserTaskCount(user);
    
    if (user.avatar) {
        updateAvatar('#profileAvatar', user.avatar);
        updateAvatar('.user-avatar-placeholder', user.avatar);
    }

    const editBtn = document.getElementById('editProfileBtn');
    
    if (editBtn) {
        editBtn.addEventListener('click', function(e) {
            e.preventDefault();
            toggleEditMode();
        });
    }
    
    const changeAvatarBtn = document.getElementById('changeAvatarBtn');
    const avatarInput = document.getElementById('avatarInput');
    
    if (changeAvatarBtn && avatarInput) {
        changeAvatarBtn.addEventListener('click', function(e) {
            e.preventDefault();
            avatarInput.click();
        });
        
        avatarInput.addEventListener('change', handleAvatarChange);
    }
});

let isEditMode = false;
let originalData = {};

function updateAvatar(selector, avatarUrl) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
        if (avatarUrl) {
            element.innerHTML = `<img src="${avatarUrl}" alt="Profile Picture" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
        } else {
            element.innerHTML = '<i class="bi bi-person-fill"></i>';
        }
    });
}

async function loadProfileData(user) {
    document.getElementById('headerUserName').textContent = user.fullName || user.name;
    document.getElementById('headerUserRole').textContent = user.role === 'admin' ? 'Administrator' : 'Product Designer';

    updateAvatar('.user-avatar-placeholder', user.avatar);

    document.getElementById('profileName').textContent = user.fullName || user.name;
    document.getElementById('profileEmail').textContent = user.email;
    
    updateAvatar('#profileAvatar', user.avatar);
    
    const roleBadge = document.getElementById('profileRoleBadge');
    if (user.role === 'admin') {
        roleBadge.textContent = 'System Admin';
        roleBadge.className = 'badge bg-primary mb-3';
    } else {
        roleBadge.textContent = 'User';
        roleBadge.className = 'badge bg-info mb-3';
    }

    const fullName = user.fullName || user.name;
    const employeeId = user.employeeId || `CZ-${String(user.id).padStart(6, '0')}`;
    const phone = user.phone || '+1 (555) 123-4567';
    const department = user.department || 'Computer Science';
    const roleLevel = user.role === 'admin' ? 'Senior Administrator' : 'Student';
    const joinDate = user.joinDate || formatDate(new Date());
    
    document.getElementById('infoFullName').textContent = fullName;
    document.getElementById('infoEmployeeId').textContent = employeeId;
    document.getElementById('infoPhone').textContent = phone;
    document.getElementById('infoDepartment').textContent = department;
    document.getElementById('infoRoleLevel').textContent = roleLevel;
    document.getElementById('infoJoinDate').textContent = joinDate;
    
    originalData = {
        fullName,
        employeeId,
        phone,
        department,
        roleLevel,
        joinDate
    };
}

async function loadUserTaskCount(user) {
    try {
        const response = await fetch('http://localhost:3000/tasks');
        const tasks = await response.json();
        
        // Contar tareas del usuario
        const userTasks = tasks.filter(task => task.userId == user.id);
        document.getElementById('profileTaskCount').textContent = userTasks.length;
        
    } catch (error) {
        console.error('Error loading task count:', error);
        document.getElementById('profileTaskCount').textContent = '0';
    }
}

function toggleEditMode() {
    const user = getCurrentUser();
    isEditMode = !isEditMode;
    
    if (isEditMode) {
        // Activate edit mode
        document.getElementById('editProfileBtn').innerHTML = '<i class="bi bi-x-lg"></i> Cancel';
        
        // Convert fields to inputs
        document.getElementById('infoFullName').innerHTML = `<input type="text" class="form-control form-control-sm" value="${originalData.fullName}" id="editFullName">`;
        document.getElementById('infoPhone').innerHTML = `<input type="text" class="form-control form-control-sm" value="${originalData.phone}" id="editPhone">`;
        document.getElementById('infoDepartment').innerHTML = `<input type="text" class="form-control form-control-sm" value="${originalData.department}" id="editDepartment">`;
        
        // Add save button
        const cardBody = document.querySelector('.card-body');
        const saveBtn = document.createElement('div');
        saveBtn.className = 'mt-4 text-end';
        saveBtn.id = 'saveButtonContainer';
        saveBtn.innerHTML = '<button class="btn btn-primary" onclick="saveProfile()"><i class="bi bi-check-lg"></i> Save Changes</button>';
        cardBody.appendChild(saveBtn);
        
    } else {
        // Cancel edit
        cancelEdit();
    }
}

function cancelEdit() {
    isEditMode = false;
    document.getElementById('editProfileBtn').innerHTML = '<i class="bi bi-pencil"></i> Edit Profile';
    
    // Restore original values
    document.getElementById('infoFullName').textContent = originalData.fullName;
    document.getElementById('infoPhone').textContent = originalData.phone;
    document.getElementById('infoDepartment').textContent = originalData.department;
    
    // Remove save button
    const saveBtn = document.getElementById('saveButtonContainer');
    if (saveBtn) saveBtn.remove();
}

async function saveProfile() {
    const user = getCurrentUser();
    console.log('Saving profile');
    
    const newFullName = document.getElementById('editFullName').value.trim();
    const newPhone = document.getElementById('editPhone').value.trim();
    const newDepartment = document.getElementById('editDepartment').value.trim();
    console.log('New values:', { newFullName, newPhone, newDepartment });
    
    if (!newFullName) {
        console.log('Validation failed: empty name');
        alert('Full name is required');
        return;
    }
    
    try {
        // Update in JSON Server
        const response = await fetch(`http://localhost:3000/users/${user.id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fullName: newFullName,
                phone: newPhone,
                department: newDepartment
            })
        });
        
        if (!response.ok) throw new Error('Error updating profile');
        
        const updatedUser = await response.json();
        
        // Update localStorage
        saveSession(updatedUser);
        
        // Update original data
        originalData.fullName = newFullName;
        originalData.phone = newPhone;
        originalData.department = newDepartment;
        
        // Exit edit mode
        cancelEdit();
        
        // Reload data
        loadProfileData(updatedUser);
        
        alert('Profile updated successfully');
        
    } catch (error) {
        console.error('Error saving profile:', error);
        alert('Error saving changes. Please try again.');
    }
}

function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

async function handleAvatarChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
        alert('Image must not exceed 2MB');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = async function(e) {
        const avatarBase64 = e.target.result;
        const user = getCurrentUser();
        
        try {
            const response = await fetch(`http://localhost:3000/users/${user.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    avatar: avatarBase64
                })
            });
            
            if (!response.ok) throw new Error('Error updating avatar');
            
            const updatedUser = await response.json();
            
            saveSession(updatedUser);
            
            updateAvatar('#profileAvatar', avatarBase64);
            updateAvatar('.user-avatar-placeholder', avatarBase64);
            
            alert('Profile photo updated successfully');
            
        } catch (error) {
            console.error('Error uploading avatar:', error);
            alert('Error uploading image. Please try again.');
        }
    };
    
    reader.readAsDataURL(file);
}
function logout() {
    if (confirm('Are you sure you want to log out?')) {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}