document.addEventListener('DOMContentLoaded', function() {
    const user = getCurrentUser();
    console.log('Dashboard loaded, user:', user);
    
    if (!user) {
        console.log('No user, redirecting to login');
        window.location.href = 'index.html';
        return;
    }
    
    if (user.role !== 'user') {
        console.log('User is admin, redirecting');
        window.location.href = 'admin-dashboard.html';
        return;
    }
    
    if (user.avatar) {
        console.log('User has avatar, updating...');
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
    
    document.getElementById('userName').textContent = user.fullName;
    
    const roleElement = document.getElementById('userRole');
    if (user.role === 'admin') {
        roleElement.textContent = 'Administrator';
    } else {
        roleElement.textContent = 'Student';
    }
    
    loadDashboardData();
    console.log('Loading user tasks...');
    loadUserTasks();
});

async function loadDashboardData() {
    const user = getCurrentUser();
    console.log('Loading dashboard metrics');
    
    try {
        const response = await fetch(`${API_URL}/tasks?userId=${user.id}`);
        const tasks = await response.json();
        console.log('Tasks loaded:', tasks.length);
        
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.status === 'completed').length;
        const pendingTasks = tasks.filter(task => task.status === 'pending').length;
        const inProgressTasks = tasks.filter(task => task.status === 'in-progress').length;
        
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        const highPriorityPending = tasks.filter(task => 
            (task.status === 'pending' || task.status === 'in-progress') && 
            task.priority === 'high'
        ).length;
        
        document.getElementById('totalTasks').textContent = totalTasks;
        document.getElementById('completedTasks').textContent = completedTasks;
        document.getElementById('pendingTasks').textContent = pendingTasks + inProgressTasks;
        document.getElementById('overallProgress').textContent = progress + '%';
        document.getElementById('highPriorityCount').textContent = highPriorityPending;
        
    } catch (error) {
        console.error('Error loading metrics:', error);
    }
}

async function loadUserTasks() {
    const user = getCurrentUser();
    
    try {
        const response = await fetch(`${API_URL}/tasks?userId=${user.id}`);
        const tasks = await response.json();
        
        displayTasks(tasks);
    } catch (error) {
        console.log('Error loading tasks:', error);
    }
}

function displayTasks(tasks) {
    const tbody = document.getElementById('tasksTableBody');
    tbody.innerHTML = '';
    
    if (tasks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">You have no tasks created</td></tr>';
        return;
    }
    
    tasks.forEach(task => {
        const row = document.createElement('tr');
        
        // Status badge con colores del Figma
        let statusBadge = '';
        switch(task.status) {
            case 'pending':
                statusBadge = '<span class="badge bg-warning text-dark">Pending</span>';
                break;
            case 'in-progress':
                statusBadge = '<span class="badge bg-primary">In Progress</span>';
                break;
            case 'completed':
                statusBadge = '<span class="badge bg-success">Completed</span>';
                break;
        }
        
        // Priority con puntos de color como en el Figma
        let priorityBadge = '';
        switch(task.priority) {
            case 'low':
                priorityBadge = '<span class="d-flex align-items-center gap-2"><span class="priority-dot bg-success"></span>Low</span>';
                break;
            case 'medium':
                priorityBadge = '<span class="d-flex align-items-center gap-2"><span class="priority-dot bg-warning"></span>Medium</span>';
                break;
            case 'high':
                priorityBadge = '<span class="d-flex align-items-center gap-2"><span class="priority-dot bg-danger"></span>High</span>';
                break;
        }
        
        // Due date
        let dueDate = 'No date';
        if (task.dueDate) {
            const date = new Date(task.dueDate);
            dueDate = date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
            });
        }
        
        // Assignee (por ahora el usuario actual)
        const user = getCurrentUser();
        const assignee = `
            <div class="d-flex align-items-center gap-2">
                <div class="assignee-avatar">
                    <i class="bi bi-person-fill"></i>
                </div>
                <span class="text-muted">${user.fullName}</span>
            </div>
        `;
        
        row.innerHTML = `
            <td>
                <div>
                    <div class="fw-semibold text-dark">${task.title}</div>
                    ${task.description ? `<small class="text-muted">${task.description}</small>` : ''}
                </div>
            </td>
            <td>${assignee}</td>
            <td>${statusBadge}</td>
            <td>${priorityBadge}</td>
            <td class="text-muted">${dueDate}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editTask(${task.id})" title="Edit">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteTask(${task.id})" title="Delete">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Crear una nueva tarea
document.getElementById('newTaskForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const user = getCurrentUser();
    const taskData = {
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDescription').value,
        priority: document.getElementById('taskPriority').value,
        dueDate: document.getElementById('taskDueDate').value || null,
        status: 'pending',
        userId: user.id,
        createdAt: new Date().toISOString()
    };
    
    try {
        const response = await fetch(`${API_URL}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(taskData)
        });
        
        if (response.ok) {

            const modal = bootstrap.Modal.getInstance(document.getElementById('newTaskModal'));
            modal.hide();

            this.reset();
            
            loadDashboardData();
            loadUserTasks();
            
            alert('Task created successfully');
        }
    } catch (error) {
        alert('Error creating task');
        console.log('Error:', error);
    }
});

// Filtros de tareas
document.querySelectorAll('[data-filter]').forEach(button => {
    button.addEventListener('click', async function() {
        // Cambiar botón activo
        document.querySelectorAll('[data-filter]').forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        
        const filter = this.getAttribute('data-filter');
        const user = getCurrentUser();
        
        let url = `${API_URL}/tasks?userId=${user.id}`;
        if (filter !== 'all') {
            if (filter === 'pending') {
                // Incluir pending e in-progress
                url = `${API_URL}/tasks?userId=${user.id}&status=pending`;
            } else {
                url = `${API_URL}/tasks?userId=${user.id}&status=${filter}`;
            }
        }
        
        try {
            const response = await fetch(url);
            let tasks = await response.json();
            
            // If filter is pending, also add in-progress
            if (filter === 'pending') {
                const progressResponse = await fetch(`${API_URL}/tasks?userId=${user.id}&status=in-progress`);
                const progressTasks = await progressResponse.json();
                tasks = [...tasks, ...progressTasks];
            }
            
            displayTasks(tasks);
        } catch (error) {
            console.log('Error filtering tasks:', error);
        }
    });
});

// Búsqueda de tareas
document.getElementById('searchInput').addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    const rows = document.querySelectorAll('#tasksTableBody tr');
    
    rows.forEach(row => {
        const taskName = row.cells[0]?.textContent.toLowerCase() || '';
        if (taskName.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
});

// Edit task
async function editTask(taskId) {
    // For now, just change the status
    const newStatus = prompt('New status (pending, in-progress, completed):');
    if (!newStatus || !['pending', 'in-progress', 'completed'].includes(newStatus)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: newStatus })
        });
        
        if (response.ok) {
            loadDashboardData();
            loadUserTasks();
            alert('Task updated');
        }
    } catch (error) {
        alert('Error updating task');
    }
}

// Delete task
async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadDashboardData();
            loadUserTasks();
            alert('Task deleted');
        }
    } catch (error) {
        alert('Error deleting task');
    }
}