let selectedCategory = "School";
let selectedPriority = "Medium";
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
localStorage.removeItem('tasks');

let currentCategory = "All";
let currentPriority = "All";
let searchQuery = "";

let editTaskId = null;
let deleteTaskId = null;

let currentDate = new Date();

let confettiShown = false;
const canvas = document.getElementById('confetti-canvas');

const myConfetti = confetti.create(canvas, {
  resize: true,
  useWorker: true
});

const taskNameInput = document.getElementById('task-title');
const dueDateInput = document.getElementById('task-date');
const saveTaskBtn = document.getElementById("save-task-btn");
const taskList = document.getElementById('taskList');
const progressBar = document.getElementById('prog-bar');


function openEditModal(taskId) {
  const task = tasks.find(t => t.id == taskId);
  if (!task) return;

  editTaskId = taskId;
  document.getElementById('edit-task-title').value = task.name;
  document.getElementById('edit-task-date').value = task.dueDate;
  document.getElementById('edit-task-category').value = task.category;
  document.getElementById('edit-task-priority').value = task.priority;

  document.getElementById('editModal').style.display = 'flex';
}

function closeEditModal() {
  document.getElementById('editModal').style.display = 'none';
}

document.getElementById('saveEditBtn').addEventListener('click', () => {
  const name = document.getElementById('edit-task-title').value;
  const dueDate = document.getElementById('edit-task-date').value;
  const category = document.getElementById('edit-task-category').value;
  const priority = document.getElementById('edit-task-priority').value;

  const task = tasks.find(t => t.id === editTaskId);
  if (!task) return;

  task.name = name;
  task.dueDate = dueDate;
  task.category = category;
  task.priority = priority;

  saveTasksToLocalStorage();
  renderCalendar(currentDate);
  showToast('Task Updated Successfully!', 'info');
  renderTasks();
  closeEditModal();
});

function openDeleteModal(taskId) {
  document.getElementById("deleteModal").style.display = "flex";
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  deleteTaskId = taskId;

  const confirmMsg = document.getElementById('delete-confirm-message');
  confirmMsg.textContent = `Are you sure you want to delete the task '${task.name}'?`;
}

function closeDeleteModal() {
  document.getElementById("deleteModal").style.display = "none";
}

document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
  tasks = tasks.filter(t => t.id !== deleteTaskId);
  saveTasksToLocalStorage();
  renderTasks();
  renderCalendar(currentDate);
  showToast('Task Deleted Successfully!', 'success');
  closeDeleteModal();
});

document.querySelectorAll('.cat-filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    currentCategory = btn.dataset.filter;
    updateCategoryButtons(btn);
    filterTasks();
  });
});

document.querySelectorAll('.priority-filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    currentPriority = btn.dataset.priority;
    updatePriorityButtons(btn);
    filterTasks();
  });
});

document.getElementById('searchInput').addEventListener('input', e => {
  searchQuery = e.target.value.toLowerCase();
  filterTasks();
});

function updateCategoryButtons(activeBtn) {
  document.querySelectorAll('.cat-filter-btn').forEach(btn =>
    btn.classList.remove('active')
  );
  activeBtn.classList.add('active');
}

function updatePriorityButtons(activeBtn) {
  document.querySelectorAll('.priority-filter-btn').forEach(btn =>
    btn.classList.remove('active')
  );
  activeBtn.classList.add('active');
}

function filterTasks() {
  const tasks = document.querySelectorAll('.task-item');
  let visibleCount = 0;

  tasks.forEach(task => {
    const taskTitle = task.querySelector('.task-title').textContent.toLowerCase();
    const taskCategory = task.dataset.category;
    const taskPriority = task.dataset.priority;

    const matchesCategory = (currentCategory === "All" || taskCategory === currentCategory);
    const matchesPriority = (currentPriority === "All" || taskPriority.toLowerCase() === currentPriority.toLowerCase());
    const matchesSearch = taskTitle.includes(searchQuery);

      const isVisible = matchesCategory && matchesPriority && matchesSearch;

      task.style.display = isVisible ? "" : "none";
      if (isVisible) visibleCount++;
  });

  const noTasksMessage = document.getElementById('no-tasks-message');
  if (noTasksMessage) {
    noTasksMessage.style.display = visibleCount === 0 ? 'block' : 'none';
  }
}

document.querySelectorAll(".category-btn").forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll(".category-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedCategory = btn.dataset.category;
  });
});

document.querySelectorAll(".priority-btn").forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll(".priority-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedPriority = btn.dataset.priority;
  });
});


function addTask(){
  const name = taskNameInput.value.trim();
  const dueDate = dueDateInput.value;

  if(!name || !selectedCategory || !dueDate || !selectedPriority) {
    showToast('Please fill all fields', 'error');
    return;
  }

  const task = {
    id: Date.now(),
    name,
    category: selectedCategory,
    priority: selectedPriority,
    dueDate,
    completed: false
  };

  tasks.unshift(task);
  saveTasksToLocalStorage();
  renderCalendar(currentDate);
  renderTasks();
  showToast('Task Added Successfully!', 'success');
  clearForm();
}

function clearForm() {
  taskNameInput.value = '';
  dueDateInput.value = '';
  selectedCategory = null;
  selectedPriority = null;

  document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('active'));
}

function toggleTaskCompletion(id) {
  const task = tasks.find(t => t.id === id);
  task.completed = !task.completed;
  saveTasksToLocalStorage();

  document.querySelectorAll('.task-item').forEach(item => {
    item.classList.add('moving');
  });
  setTimeout(() => {
    renderCalendar(currentDate);
    renderTasks();
  }, 0);
  if(task.completed){
    //showToast(`Task '${task.name}'`, 'success');
    showToast(`Task '${task.name}' completed`, 'success');
  }
  /* else{
    showToast('task incompelete', 'success');
  } */
}

function renderTasks(){
  taskList.innerHTML = '';
  let completedCount = 0;

  const sortedTasks = [...tasks].sort((a, b) => a.completed - b.completed);

  sortedTasks.forEach(task => {
    const priorityClass = (task.priority || 'low').toLowerCase(); 
    const div = document.createElement('div');
    div.className = 'task-item';
    div.setAttribute('data-category', task.category || 'uncategorized');
    div.setAttribute('data-priority', task.priority || 'unprioritizing');

    if(task.completed) {
      div.classList.add('completed');
    }

    div.innerHTML = `
      <div class="check-part">
        <input type="checkbox" ${task.completed ? 'checked' : ''} />
       <span class="checkmark"><i class="fas fa-check"></i></span>
      </div>

     <div class="mid-part">
      <div class="task-title-div">
        <span class="task-title ${task.completed ? 'task-done' : ''}">${task.name}</span>   
      </div>
      <div class="cat-div">
        ${task.category || 'Uncategorized'}
      </div>
      <div class="date-div">
        ${task.dueDate || 'unprioritizing'}
      </div>       
    </div>

    <div class="last-part">
      <div class="edit-delete">
        <i class="fa-solid fa-pen-to-square edit-task" title="Edit Task"></i>
        <i class="fa-solid fa-trash delete-task" title="Delete Task"></i>
      </div>
      <div class="prio-part ${priorityClass}">
        ${task.priority}
      </div>
    </div>
    `;
    div.querySelector('.edit-task').addEventListener('click', () => openEditModal(task.id));
    div.querySelector('.delete-task').addEventListener('click', () => openDeleteModal(task.id));

    div.querySelector('input').addEventListener('change', () => toggleTaskCompletion(task.id));
    taskList.appendChild(div);

    if (task.completed) completedCount++;

  });

  const progress = tasks.length ? (completedCount / tasks.length) * 100 : 0;
  progressBar.style.width = `${progress}%`;
  document.getElementById('prog-text').textContent = `${Math.round(progress)}%`;
  saveTasksToLocalStorage();

  filterTasks();
  checkAllTasksCompleted();

}

function checkAllTasksCompleted() {
  const allCompleted = tasks.length > 0 && tasks.every(task => task.completed);
  const celebration = document.getElementById('celebration-message');

  if (allCompleted && !confettiShown) {
    confettiShown = true;
    celebration.classList.add('show');

    // Confetti burst
    myConfetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.9 }
    });

    setTimeout(() => {
      celebration.classList.remove('show');
    }, 3000); // Show for 3 seconds
  } else if(!allCompleted) {
    confettiShown = false;
  }
}

saveTaskBtn.addEventListener('click', addTask);


const screens = document.querySelectorAll('.screen');
function showScreen(id) {
  screens.forEach(screen => screen.classList.remove('active'));
  document.getElementById(id).classList.add('active');

  document.querySelectorAll('.navbar div').forEach(div => {
    div.classList.remove('active');

    const icon = div.querySelector('i');
    if (icon) {
      // Reset all to regular
      icon.classList.remove('fa-solid');
      icon.classList.add('fa-regular');
    }
  });

  const activeTab = document.querySelector(`.navbar .${id}`);
  activeTab.classList.add('active');

  const activeIcon = activeTab.querySelector('i');
  if (activeIcon) {
    // Make active one solid
    activeIcon.classList.remove('fa-regular');
    activeIcon.classList.add('fa-solid');
  }
}

const monthYear = document.getElementById("current-month-year");
const calendarDays = document.getElementById("calendar-days");
const prevBtn = document.getElementById("prev-month");
const nextBtn = document.getElementById("next-month");


function renderCalendar(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const today = new Date();

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  monthYear.textContent = `${date.toLocaleString('default', { month: 'long' })} ${year}`;

  calendarDays.innerHTML = "";

  for (let i = 0; i < firstDay; i++) {
    calendarDays.innerHTML += `<div></div>`;
  }

  // Fill the calendar with actual days
  for (let day = 1; day <= lastDate; day++) {
    const formattedDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const isToday = (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );

    const hasTasks = tasks.some(task => task.dueDate === formattedDate);


    const dayDiv = document.createElement("div");
    dayDiv.className = "calendar-day";
    if (isToday) dayDiv.classList.add("today");
    dayDiv.textContent = day;

    if (hasTasks) {
      const dot = document.createElement("div");
      dot.classList.add("task-dot");
      dayDiv.appendChild(dot);
    }

    dayDiv.addEventListener("click", () => {
      
      document.querySelectorAll(".calendar-day").forEach(d => d.classList.remove("selected"));

      dayDiv.classList.add("selected");

      const selectedText = document.getElementById("selected-date-text");
    
      selectedText.textContent = `Tasks for ${formattedDate}`;

      const dayTasksContainer = document.getElementById("day-tasks-container");
      const dayTasks = tasks.filter(task => task.dueDate === formattedDate);

      dayTasksContainer.innerHTML = "";

      if (dayTasks.length === 0) {
        dayTasksContainer.innerHTML = `<p class="no-task-msg">No tasks found.</p>`;
      } else {
        dayTasks.forEach(task => {
          const taskBox = document.createElement("div");
          taskBox.classList.add("task-box");
          taskBox.textContent = task.name;
          dayTasksContainer.appendChild(taskBox);
        });
      }

    });

    calendarDays.appendChild(dayDiv);

    if (isToday) {
      setTimeout(() => dayDiv.click(), 0);
    }
  }
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.classList.add('toast');

  // Choose icon & color based on type
  let icon = '';
  switch(type) {
    case 'success':
      icon = '<i class="fas fa-check-circle"></i>'; 
      //toast.style.background = 'linear-gradient(135deg, #4caf50, #388e3c)';
      toast.style.background = 'linear-gradient(135deg, #007BFF, #1e88e5)';
      break;
    case 'error':
      icon = '<i class="fas fa-times-circle"></i>';
      toast.style.background = 'linear-gradient(135deg, #e53935, #b71c1c)';
      break;
    case 'info':
      icon = '<i class="fas fa-info-circle"></i>';
      toast.style.background = 'linear-gradient(135deg, #007BFF 30%, #1e88e5)';
      break;
    case 'warning':
      icon = '<i class="fas fa-exclamation-triangle"></i>';
      toast.style.background = 'linear-gradient(135deg, #fbc02d, #f57f17)';
      toast.style.color = '#333';
      break;
    default:
      icon = '<i class="fas fa-check-circle"></i>';
      toast.style.background = 'linear-gradient(135deg, #4caf50, #388e3c)';
  }

  toast.innerHTML = `<span class="icon">${icon}</span><span>${message}</span>`;
  container.appendChild(toast);

  // Remove toast after 3.2 seconds (matches fadeOut animation)
  setTimeout(() => {
    container.removeChild(toast);
  }, 2000);
}



prevBtn.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  renderCalendar(currentDate);
});

nextBtn.addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  renderCalendar(currentDate);
});

function saveTasksToLocalStorage() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}


renderCalendar(currentDate);

window.addEventListener("DOMContentLoaded", () => {
  renderTasks();
});

window.addEventListener('resize', () => {
  document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
});
window.dispatchEvent(new Event('resize'));

