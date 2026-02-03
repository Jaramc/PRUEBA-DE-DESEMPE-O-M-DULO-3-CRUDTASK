document.addEventListener('DOMContentLoaded', function() {
    const user = getCurrentUser();
    console.log('Admin dashboard loaded, user:', user);
    
    if (!user) {
        console.log('No session, redirecting');
        window.location.href = 'index.html';
        return;
    }
    
    if (user.role !== 'admin') {
        console.log('User is not admin, redirecting');
        window.location.href = 'user-dashboard.html';
        return;
    }
    
    document.getElementById('userName').textContent = user.fullName;
    document.getElementById('userRole').textContent = 'Administrator';
    
    console.log('Loading admin dashboard data...');
    loadDashboardData();
    loadAllTasks();
    
    document.getElementById('searchInput').addEventListener('input', filterTasks);
    document.getElementById('statusFilter').addEventListener('change', filterTasks);
    document.getElementById('priorityFilter').addEventListener('change', filterTasks);
});

let allTasks = [];
let allUsers = [];

async function loadDashboardData() {
    try {
        const tasksResponse = await fetch(`${API_URL}/tasks`);
        const tasks = await tasksResponse.json();
        
        const usersResponse = await fetch(`${API_URL}/users`);
        const users = await usersResponse.json();
        
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.status === 'completed').length;
        const pendingTasks = tasks.filter(task => task.status === 'pending' || task.status === 'in-progress').length;
        const totalUsers = users.filter(user => user.role === 'user').length;
        
        document.getElementById('totalTasks').textContent = totalTasks;
        document.getElementById('completedTasks').textContent = completedTasks;
        document.getElementById('pendingTasks').textContent = pendingTasks;
        document.getElementById('totalUsers').textContent = totalUsers;
        
    } catch (error) {
        console.error('Error cargando métricas:', error);
    }
}

// Load all tasks from all users
async function loadAllTasks() {
    console.log('Loading all tasks (admin)');
    try {
        const tasksResponse = await fetch(`${API_URL}/tasks`);
        allTasks = await tasksResponse.json();
        console.log('Tasks loaded:', allTasks.length);
        
        const usersResponse = await fetch(`${API_URL}/users`);
        allUsers = await usersResponse.json();
        console.log('Users loaded:', allUsers.length);
        
        console.log('Displaying tasks in admin table...');
        displayTasks(allTasks);
        
    } catch (error) {
        console.error('Error cargando tareas:', error);
        document.getElementById('tasksTableBody').innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-danger">
                    <i class="bi bi-exclamation-triangle"></i> Error loading tasks
                </td>
            </tr>
        `;
    }
}

// Display tasks in table
function displayTasks(tasks) {
    const tbody = document.getElementById('tasksTableBody');
    
    if (tasks.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted">
                    <i class="bi bi-inbox"></i> No tasks found
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = tasks.map(task => {
        const assignedUser = allUsers.find(u => u.id === task.userId);
        const userName = assignedUser ? assignedUser.fullName : 'Unknown User';
        
        let statusClass = 'bg-secondary';
        let statusText = 'Pending';
        
        if (task.status === 'completed') {
            statusClass = 'bg-success';
            statusText = 'Completed';
        } else if (task.status === 'in-progress') {
            statusClass = 'bg-primary';
            statusText = 'In Progress';
        } else if (task.status === 'pending') {
            statusClass = 'bg-warning';
            statusText = 'Pending';
        }
        
        let priorityClass = 'text-secondary';
        let priorityDot = '';
        
        if (task.priority === 'high') {
            priorityClass = 'text-danger';
            priorityDot = '<span class="priority-dot bg-danger"></span>';
        } else if (task.priority === 'medium') {
            priorityClass = 'text-warning';
            priorityDot = '<span class="priority-dot bg-warning"></span>';
        } else if (task.priority === 'low') {
            priorityClass = 'text-success';
            priorityDot = '<span class="priority-dot bg-success"></span>';
        }
        
        const dueDate = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date';
        
        return `
            <tr>
                <td>
                    <div class="fw-semibold">${task.title || 'Untitled Task'}</div>
                    <small class="text-muted">${task.description ? task.description.substring(0, 50) + '...' : 'No description'}</small>
                </td>
                <td>
                    <div class="d-flex align-items-center gap-2">
                        <div class="user-avatar-small">
                            <i class="bi bi-person-fill"></i>
                        </div>
                        ${userName}
                    </div>
                </td>
                <td>
                    <span class="badge ${statusClass}">${statusText}</span>
                </td>
                <td>
                    <span class="${priorityClass}">
                        ${priorityDot}
                        ${task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : 'Medium'}
                    </span>
                </td>
                <td>${dueDate}</td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-outline-primary" onclick="editTask(${task.id})" title="Edit">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="deleteTask(${task.id})" title="Delete">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function filterTasks() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const priorityFilter = document.getElementById('priorityFilter').value;
    
    let filteredTasks = allTasks;
    
    if (searchTerm) {
        filteredTasks = filteredTasks.filter(task => 
            (task.title && task.title.toLowerCase().includes(searchTerm)) ||
            (task.description && task.description.toLowerCase().includes(searchTerm))
        );
    }
    
    if (statusFilter) {
        filteredTasks = filteredTasks.filter(task => task.status === statusFilter);
    }
    
    if (priorityFilter) {
        filteredTasks = filteredTasks.filter(task => task.priority === priorityFilter);
    }
    
    displayTasks(filteredTasks);
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('priorityFilter').value = '';
    displayTasks(allTasks);
}

function editTask(taskId) {
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;
    
    document.getElementById('editTaskId').value = task.id;
    document.getElementById('editTitle').value = task.title || '';
    document.getElementById('editDescription').value = task.description || '';
    document.getElementById('editStatus').value = task.status || 'pending';
    document.getElementById('editPriority').value = task.priority || 'medium';
    document.getElementById('editDueDate').value = task.dueDate || '';
    
    const modal = new bootstrap.Modal(document.getElementById('editTaskModal'));
    modal.show();
}

async function saveTaskChanges() {
    const taskId = document.getElementById('editTaskId').value;
    const title = document.getElementById('editTitle').value;
    const description = document.getElementById('editDescription').value;
    const status = document.getElementById('editStatus').value;
    const priority = document.getElementById('editPriority').value;
    const dueDate = document.getElementById('editDueDate').value;
    
    if (!title.trim()) {
        alert('Task title is required');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title,
                description,
                status,
                priority,
                dueDate
            })
        });
        
        if (!response.ok) throw new Error('Error updating task');
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('editTaskModal'));
        modal.hide();
        
        await loadDashboardData();
        await loadAllTasks();
        
        alert('Task updated successfully!');
        
    } catch (error) {
        console.error('Error updating task:', error);
        alert('Error updating task. Please try again.');
    }
}

async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Error deleting task');
        
        await loadAllTasks();
        
        alert('Task deleted successfully!');
        
    } catch (error) {
        console.error('Error deleting task:', error);
        alert('Error deleting task. Please try again.');
    }
}