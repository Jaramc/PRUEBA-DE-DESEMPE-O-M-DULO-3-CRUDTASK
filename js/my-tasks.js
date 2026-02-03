document.addEventListener('DOMContentLoaded', function() {
    const user = getCurrentUser();
    console.log('My tasks loaded, user:', user);
    if (!user) {
        console.log('No session, redirecting');
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('userName').textContent = user.name;
    document.getElementById('userRole').textContent = user.role === 'admin' ? 'Administrator' : 'Product Designer';

    if (user.avatar) {
        const updateAvatarsWithRetry = (retries = 3) => {
            const avatarElements = document.querySelectorAll('.user-avatar-placeholder');
            
            if (avatarElements.length === 0 && retries > 0) {
                setTimeout(() => updateAvatarsWithRetry(retries - 1), 200);
                return;
            }
            
            avatarElements.forEach(el => {
                el.innerHTML = `<img src="${user.avatar}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
            });
        };
        
        updateAvatarsWithRetry();
    }

    loadMyTasks();

    document.getElementById('searchInput').addEventListener('input', filterTasks);
    document.getElementById('selectAll').addEventListener('change', toggleSelectAll);
});

let allTasks = [];
let currentUser = null;

async function loadMyTasks() {
    try {
        currentUser = getCurrentUser();
        if (!currentUser) return;

        console.log('Loading my tasks for user:', currentUser.id);
        const response = await fetch('http://localhost:3000/tasks');
        const tasks = await response.json();
        console.log('Total tasks retrieved:', tasks.length);
        
        allTasks = tasks.filter(task => task.userId == currentUser.id);
        console.log('Filtered tasks:', allTasks.length);
        
        console.log('Updating metrics...');
        updateMetrics(allTasks);
        console.log('Displaying tasks in table...');
        displayTasks(allTasks);
        
    } catch (error) {
        console.error('Error loading my tasks:', error);
        showError('Error loading tasks');
    }
}

function updateMetrics(tasks) {
    const total = tasks.length;
    const inProgress = tasks.filter(task => task.status === 'In Progress').length;
    const completed = tasks.filter(task => task.status === 'Completed').length;
    const pending = tasks.filter(task => task.status === 'Pending').length;

    document.getElementById('totalTasks').textContent = total;
    document.getElementById('inProgressTasks').textContent = inProgress;
    document.getElementById('completedTasks').textContent = completed;
    document.getElementById('pendingTasks').textContent = pending;
}

function displayTasks(tasks) {
    const tbody = document.getElementById('tasksTableBody');
    
    if (tasks.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-muted py-4">
                    <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                    You have no assigned tasks
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = tasks.map(task => `
        <tr>
            <td>
                <input type="checkbox" class="form-check-input task-checkbox" value="${task.id}">
            </td>
            <td>
                <div>
                    <div class="fw-semibold">${task.title}</div>
                    <small class="text-muted">${task.description || 'No description'}</small>
                </div>
            </td>
            <td>
                <span class="badge bg-light text-dark">${task.category || 'General'}</span>
            </td>
            <td>
                ${task.priority ? `<span class="priority-dot priority-${task.priority.toLowerCase()}" aria-label="${task.priority} priority"></span>
                ${task.priority}` : '-'}
            </td>
            <td>
                <span class="badge bg-${getStatusColor(task.status)}">${task.status}</span>
            </td>
        </tr>
    `).join('');

    // Actualizar contadores
    document.getElementById('taskCount').textContent = tasks.length;
    document.getElementById('totalTaskCount').textContent = allTasks.length;
}

function getStatusColor(status) {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
        case 'completed':
            return 'success';
        case 'in progress':
        case 'in-progress':
            return 'primary';
        case 'pending':
            return 'warning';
        default:
            return 'secondary';
    }
}

function filterTasks() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    if (!searchTerm) {
        displayTasks(allTasks);
        return;
    }

    const filteredTasks = allTasks.filter(task => 
        task.title.toLowerCase().includes(searchTerm) ||
        task.category.toLowerCase().includes(searchTerm) ||
        task.description.toLowerCase().includes(searchTerm) ||
        task.status.toLowerCase().includes(searchTerm) ||
        task.priority.toLowerCase().includes(searchTerm)
    );

    displayTasks(filteredTasks);
}

function toggleSelectAll() {
    const selectAll = document.getElementById('selectAll');
    const checkboxes = document.querySelectorAll('.task-checkbox');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAll.checked;
    });
}

function showError(message) {
    console.error(message);
}

// Function to logout 
function logout() {
    if (confirm('Are you sure you want to log out?')) {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}