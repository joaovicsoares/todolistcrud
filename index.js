const apiUrl = 'http://localhost:3000/tasks';
const taskInput = document.getElementById('task-input');
const addTaskBtn = document.getElementById('add-task-btn');
const taskList = document.getElementById('task-list');
const token = localStorage.getItem('token');

if (!token) {
    window.location.href = 'login.html';
}

async function loadTasks() {
    taskList.innerHTML = '';
    const response = await fetch(apiUrl, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token')
        window.location.href = 'login.html';
    } else {
        const tasks = await response.json();
        tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item';
            li.dataset.id = task.id;
            if (task.concluida) { 
                li.classList.add('completed');
            }

            const span = document.createElement('span');
            span.textContent = task.titulo; 

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'X';
            deleteBtn.className = 'delete-btn';
        
            li.appendChild(span);
            li.appendChild(deleteBtn);
            taskList.appendChild(li);
        });
    }
    

    
}

async function addTask() {
    const titulo = taskInput.value.trim(); 
    if (titulo === '') return;

    await fetch(apiUrl, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
         },
        body: JSON.stringify({ titulo }) 
    });
    taskInput.value = '';
    loadTasks();
}

async function handleListClick(event) {
    const target = event.target;
    const taskItem = target.closest('.task-item');
    if (!taskItem) return;

    const taskId = taskItem.dataset.id;
    
    if (target.classList.contains('delete-btn')) {
        await fetch(`${apiUrl}/${taskId}`,{ 
            method: 'DELETE',
            headers: {'Authorization': `Bearer ${token}`}
        });
        loadTasks();
    } else {
        const isCompleted = taskItem.classList.contains('completed');
        await fetch(`${apiUrl}/${taskId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ concluida: !isCompleted }) // ALTERADO: "concluida"
        });
        loadTasks();
    }
}

const logoutBtn = document.querySelector('.logoutBtn')
logoutBtn.addEventListener('click', () => {
    window.location.href = 'login.html'
    localStorage.removeItem('token')
})

document.addEventListener('DOMContentLoaded', loadTasks);
addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => e.key === 'Enter' && addTask());
taskList.addEventListener('click', handleListClick);