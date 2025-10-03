// Task Manager Pro - JavaScript Application (CORRECTION: bug d'édition + affichage mensuel)

class TaskManager {

    constructor() {
        this.tasks = [];
        this.currentView = 'week';
        this.showWeekends = false;
        this.currentDate = new Date();
        this.editingTaskId = null;

        // Default XML data for initialization
        this.defaultXmlData = `<?xml version="1.0" encoding="UTF-8"?>
<taskData>
<tasks>
<task id="default001">
<title>Réviser les rapports trimestriels</title>
<comment>Vérifier les performances financières et préparer un résumé</comment>
<priority>high</priority>
<dueDate>2025-09-22</dueDate>
<completed>false</completed>
<recurring enabled="false" frequency=""></recurring>
<createdAt>2025-09-21T10:00:00Z</createdAt>
</task>
<task id="default002">
<title>Réunion stand-up équipe</title>
<comment>Discuter des progrès du sprint actuel</comment>
<priority>medium</priority>
<dueDate>2025-09-23</dueDate>
<completed>false</completed>
<recurring enabled="true" frequency="daily"></recurring>
<createdAt>2025-09-21T11:00:00Z</createdAt>
</task>
<task id="default003">
<title>Mettre à jour la documentation</title>
<comment>Ajouter les nouveaux endpoints API aux docs</comment>
<priority>low</priority>
<dueDate>2025-09-24</dueDate>
<completed>true</completed>
<recurring enabled="false" frequency=""></recurring>
<createdAt>2025-09-20T14:00:00Z</createdAt>
<completedAt>2025-09-21T16:30:00Z</completedAt>
</task>
</tasks>
</taskData>`;

        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        this.loadTasks();
        this.bindEvents();
        this.renderCalendar();
        this.updateStatistics();
        this.setDefaultDate();
        console.log('Task Manager initialized successfully');
    }

    // Load tasks from localStorage or use default XML data
    loadTasks() {
        const saved = localStorage.getItem('taskManagerTasks');
        if (saved) {
            try {
                this.tasks = JSON.parse(saved);
                console.log('Loaded tasks from localStorage:', this.tasks.length, 'tasks');
            } catch (e) {
                console.error('Error parsing saved tasks:', e);
                this.loadDefaultXmlData();
            }
        } else {
            console.log('No saved tasks found, loading default XML data');
            this.loadDefaultXmlData();
        }
    }

    // Parse default XML data and convert to task objects
    loadDefaultXmlData() {
        try {
            this.tasks = this.parseXMLToTasks(this.defaultXmlData);
            this.saveTasks();
            console.log('Loaded default XML data:', this.tasks.length, 'tasks');
        } catch (e) {
            console.error('Error loading default XML data:', e);
            this.tasks = [];
        }
    }

    saveTasks() {
        try {
            localStorage.setItem('taskManagerTasks', JSON.stringify(this.tasks));
        } catch (e) {
            console.error('Error saving tasks:', e);
        }
    }

    setDefaultDate() {
        const dateInput = document.getElementById('taskDueDate');
        if (dateInput) {
            const today = new Date();
            dateInput.value = this.formatDateForInput(today);
        }
    }

    bindEvents() {
        console.log('Binding events...');

        // View controls
        this.bindViewControls();

        // Navigation
        this.bindNavigationControls();

        // Task management - Enhanced error handling
        this.bindTaskManagement();

        // Task detail modal
        this.bindTaskDetailModal();

        // Export/Import
        this.bindExportImport();

        // Modal backdrop clicks
        this.bindModalBackdropEvents();

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            const dropdown = document.querySelector('.dropdown');
            if (dropdown && !e.target.closest('.dropdown')) {
                dropdown.classList.remove('active');
            }
        });

        console.log('All events bound successfully');
    }

    bindViewControls() {
        const weekViewBtn = document.getElementById('weekViewBtn');
        const monthViewBtn = document.getElementById('monthViewBtn');
        const weekendToggle = document.getElementById('weekendToggle');

        if (weekViewBtn) {
            weekViewBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchView('week');
            });
        }

        if (monthViewBtn) {
            monthViewBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchView('month');
            });
        }

        if (weekendToggle) {
            weekendToggle.addEventListener('change', (e) => {
                this.toggleWeekends(e.target.checked);
            });
        }
    }

    bindNavigationControls() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const todayBtn = document.getElementById('todayBtn');

        if (prevBtn) {
            prevBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateDate(-1);
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateDate(1);
            });
        }

        if (todayBtn) {
            todayBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.goToToday();
            });
        }
    }

    bindTaskManagement() {
        const addTaskBtn = document.getElementById('addTaskBtn');
        const closeModal = document.getElementById('closeModal');
        const cancelTask = document.getElementById('cancelTask');
        const saveTask = document.getElementById('saveTask');
        const taskRecurring = document.getElementById('taskRecurring');

        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Add Task button clicked');
                this.openTaskModal();
            });
            console.log('Add Task button event listener attached');
        }

        if (closeModal) {
            closeModal.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.closeTaskModal();
            });
        }

        if (cancelTask) {
            cancelTask.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.closeTaskModal();
            });
        }

        if (saveTask) {
            saveTask.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.saveTask(e);
            });
        }

        // Fixed checkbox event listener for recurring tasks
        if (taskRecurring) {
            taskRecurring.addEventListener('change', (e) => {
                this.toggleRecurringOptions(e.target.checked);
            });
        }
    }

    bindTaskDetailModal() {
        const closeDetailModal = document.getElementById('closeDetailModal');
        const editTaskBtn = document.getElementById('editTaskBtn');
        const deleteTaskBtn = document.getElementById('deleteTaskBtn');
        const toggleCompleteBtn = document.getElementById('toggleCompleteBtn');

        if (closeDetailModal) {
            closeDetailModal.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeTaskDetailModal();
            });
        }

        if (editTaskBtn) {
            editTaskBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.editCurrentTask();
            });
        }

        if (deleteTaskBtn) {
            deleteTaskBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.deleteCurrentTask();
            });
        }

        if (toggleCompleteBtn) {
            toggleCompleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleCurrentTaskComplete();
            });
        }
    }

    bindExportImport() {
        const exportImportBtn = document.getElementById('exportImportBtn');
        const exportBtn = document.getElementById('exportBtn');
        const importBtn = document.getElementById('importBtn');
        const importFile = document.getElementById('importFile');

        if (exportImportBtn) {
            exportImportBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleDropdown();
            });
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.exportTasks();
            });
        }

        if (importBtn) {
            importBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.triggerImport();
            });
        }

        if (importFile) {
            importFile.addEventListener('change', (e) => {
                this.importTasks(e);
            });
        }
    }

    bindModalBackdropEvents() {
        const modalBackdrop = document.getElementById('modalBackdrop');
        const detailModalBackdrop = document.getElementById('detailModalBackdrop');

        if (modalBackdrop) {
            modalBackdrop.addEventListener('click', (e) => {
                if (e.target === modalBackdrop) {
                    this.closeTaskModal();
                }
            });
        }

        if (detailModalBackdrop) {
            detailModalBackdrop.addEventListener('click', (e) => {
                if (e.target === detailModalBackdrop) {
                    this.closeTaskDetailModal();
                }
            });
        }

        // Prevent modal close on content clicks
        const modalContents = document.querySelectorAll('.modal-content');
        modalContents.forEach(content => {
            content.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });
    }

    switchView(view) {
        this.currentView = view;

        document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
        const viewBtn = document.getElementById(`${view}ViewBtn`);
        if (viewBtn) viewBtn.classList.add('active');

        this.renderCalendar();
    }

    toggleWeekends(show) {
        this.showWeekends = show;
        this.renderCalendar();
    }

    navigateDate(direction) {
        if (this.currentView === 'week') {
            this.currentDate.setDate(this.currentDate.getDate() + (direction * 7));
        } else {
            this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        }
        this.renderCalendar();
    }

    goToToday() {
        this.currentDate = new Date();
        this.renderCalendar();
    }

    renderCalendar() {
        const grid = document.getElementById('calendarGrid');
        const period = document.getElementById('currentPeriod');

        if (!grid || !period) return;

        if (this.currentView === 'week') {
            this.renderWeekView(grid, period);
        } else {
            this.renderMonthView(grid, period);
        }

        this.updateStatistics();
    }

    renderWeekView(grid, period) {
        grid.className = 'calendar-grid' + (this.showWeekends ? ' show-weekends' : '');
        grid.innerHTML = '';

        const startOfWeek = this.getStartOfWeek(this.currentDate);
        const endDay = this.showWeekends ? 7 : 5;

        const periodStart = new Date(startOfWeek);
        const periodEnd = new Date(startOfWeek);
        periodEnd.setDate(periodEnd.getDate() + endDay - 1);

        period.textContent = this.formatDateRange(periodStart, periodEnd);

        for (let i = 0; i < endDay; i++) {
            const dayDate = new Date(startOfWeek);
            dayDate.setDate(dayDate.getDate() + i);
            const dayElement = this.createDayElement(dayDate, false);
            grid.appendChild(dayElement);
        }
    }

    // CORRECTION: Vue mensuelle avec calcul corrigé (bug 1)
    renderMonthView(grid, period) {
        grid.className = 'calendar-grid month-view show-weekends';
        grid.innerHTML = '';

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        period.textContent = this.currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

        // Get the first day of the month
        const firstDay = new Date(year, month, 1);
        // Get the start of the week containing the first day (CORRIGÉ)
        const startDate = this.getStartOfWeek(firstDay);

        // Generate 42 days (6 weeks × 7 days) for month view
        for (let i = 0; i < 42; i++) {
            const dayDate = new Date(startDate);
            dayDate.setDate(dayDate.getDate() + i);
            const isOtherMonth = dayDate.getMonth() !== month;
            const dayElement = this.createDayElement(dayDate, isOtherMonth);
            grid.appendChild(dayElement);
        }
    }

    createDayElement(date, isOtherMonth) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';

        if (isOtherMonth) dayElement.classList.add('other-month');
        if (this.isWeekend(date)) dayElement.classList.add('weekend');
        if (this.isToday(date)) dayElement.classList.add('today');

        const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });
        const dayNumber = date.getDate();

        dayElement.innerHTML = `
            <div class="day-header">
                <div class="day-number">${dayNumber}</div>
                <div>${dayName}</div>
            </div>
            <div class="tasks-container" data-date="${this.formatDateForStorage(date)}"></div>
        `;

        this.populateTasksForDay(dayElement, date);
        this.makeDayDroppable(dayElement);

        return dayElement;
    }

    populateTasksForDay(dayElement, date) {
        const tasksContainer = dayElement.querySelector('.tasks-container');
        const dateStr = this.formatDateForStorage(date);
        const dayTasks = this.getTasksForDate(dateStr);

        dayTasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            tasksContainer.appendChild(taskElement);
        });
    }

    createTaskElement(task) {
        const taskElement = document.createElement('div');
        taskElement.className = `task-card priority-${task.priority}${task.completed ? ' completed' : ''}`;
        taskElement.draggable = true;
        taskElement.dataset.taskId = task.id;

        const priorityLabels = {
            'critical': 'Critique',
            'high': 'Haute',
            'medium': 'Moyenne',
            'low': 'Faible'
        };

        taskElement.innerHTML = `
            <div class="task-check${task.completed ? ' completed' : ''}"></div>
            <div class="task-title">${this.escapeHtml(task.title)}</div>
            ${task.comment ? `<div class="task-comment">${this.escapeHtml(task.comment)}</div>` : ''}
            <div class="task-meta">
                <span class="task-priority">${priorityLabels[task.priority]}</span>
                ${task.recurring.enabled ? '<span>🔄</span>' : ''}
            </div>
        `;

        // Add event listeners - Fixed to ensure detail modal opens
        const taskCheck = taskElement.querySelector('.task-check');
        if (taskCheck) {
            taskCheck.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleTaskComplete(task.id);
            });
        }

        // Fixed click handler to ensure task detail modal opens
        taskElement.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Don't open modal if clicking the checkbox
            if (!e.target.classList.contains('task-check')) {
                console.log('Task clicked, opening detail modal for task:', task.id);
                this.openTaskDetailModal(task.id);
            }
        });

        this.makeTaskDraggable(taskElement);

        return taskElement;
    }

    makeTaskDraggable(taskElement) {
        taskElement.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', taskElement.dataset.taskId);
            taskElement.classList.add('dragging');
        });

        taskElement.addEventListener('dragend', () => {
            taskElement.classList.remove('dragging');
        });
    }

    makeDayDroppable(dayElement) {
        const tasksContainer = dayElement.querySelector('.tasks-container');

        tasksContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            dayElement.classList.add('drag-over');
        });

        tasksContainer.addEventListener('dragleave', () => {
            dayElement.classList.remove('drag-over');
        });

        tasksContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            dayElement.classList.remove('drag-over');

            const taskId = e.dataTransfer.getData('text/plain');
            const newDate = tasksContainer.dataset.date;

            this.moveTask(taskId, newDate);
        });
    }

    moveTask(taskId, newDate) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.dueDate = newDate;
            this.saveTasks();
            this.renderCalendar();
        }
    }

    toggleTaskComplete(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;

            if (task.completed && task.recurring.enabled) {
                this.createRecurringTask(task);
            }

            this.saveTasks();
            this.renderCalendar();
        }
    }

    createRecurringTask(originalTask) {
        const newTask = {
            ...originalTask,
            id: this.generateId(),
            completed: false,
            completedAt: null,
            createdAt: new Date().toISOString()
        };

        const dueDate = new Date(originalTask.dueDate);
        switch (originalTask.recurring.frequency) {
            case 'daily':
                dueDate.setDate(dueDate.getDate() + 1);
                break;
            case 'weekly':
                dueDate.setDate(dueDate.getDate() + 7);
                break;
            case 'monthly':
                dueDate.setMonth(dueDate.getMonth() + 1);
                break;
        }

        newTask.dueDate = this.formatDateForStorage(dueDate);
        this.tasks.push(newTask);
    }

    getTasksForDate(dateStr) {
        return this.tasks.filter(task => task.dueDate === dateStr)
            .sort((a, b) => {
                const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            });
    }

    openTaskModal(taskId = null) {
        console.log('Opening task modal...', taskId ? 'for task ' + taskId : 'for new task');
        this.editingTaskId = taskId;

        const modal = document.getElementById('taskModal');
        const form = document.getElementById('taskForm');
        const title = document.getElementById('modalTitle');

        if (!modal) {
            console.error('Task modal not found');
            return;
        }

        if (taskId) {
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                if (title) title.textContent = 'Modifier la Tâche';
                this.populateTaskForm(task);
                console.log('Edit modal opened for task:', task.title);
            } else {
                console.error('Task not found:', taskId);
                return;
            }
        } else {
            if (title) title.textContent = 'Ajouter une Nouvelle Tâche';
            if (form) form.reset();

            // Set default priority to medium
            const mediumRadio = document.querySelector('input[name="taskPriority"][value="medium"]');
            if (mediumRadio) mediumRadio.checked = true;

            this.setDefaultDate();
            this.toggleRecurringOptions(false);
            console.log('New task modal opened');
        }

        // Show modal
        modal.classList.remove('hidden');

        // Focus first input after modal is shown
        setTimeout(() => {
            const firstInput = modal.querySelector('input[type="text"]');
            if (firstInput) firstInput.focus();
        }, 100);

        console.log('Task modal opened successfully');
    }

    // Fixed populateTaskForm to properly set all form values
    populateTaskForm(task) {
        console.log('Populating form with task:', task);

        const taskTitle = document.getElementById('taskTitle');
        const taskComment = document.getElementById('taskComment');
        const taskDueDate = document.getElementById('taskDueDate');
        const taskRecurring = document.getElementById('taskRecurring');
        const taskFrequency = document.getElementById('taskFrequency');

        if (taskTitle) taskTitle.value = task.title || '';
        if (taskComment) taskComment.value = task.comment || '';
        if (taskDueDate) taskDueDate.value = task.dueDate || '';
        if (taskRecurring) taskRecurring.checked = task.recurring?.enabled || false;
        if (taskFrequency) taskFrequency.value = task.recurring?.frequency || 'daily';

        // Set priority radio button
        const priorityRadio = document.querySelector(`input[name="taskPriority"][value="${task.priority}"]`);
        if (priorityRadio) {
            priorityRadio.checked = true;
        } else {
            // Fallback to medium if priority not found
            const mediumRadio = document.querySelector('input[name="taskPriority"][value="medium"]');
            if (mediumRadio) mediumRadio.checked = true;
        }

        // Show/hide recurring options based on task setting
        this.toggleRecurringOptions(task.recurring?.enabled || false);

        console.log('Form populated successfully');
    }

    closeTaskModal() {
        console.log('Closing task modal...');
        const modal = document.getElementById('taskModal');
        if (modal) {
            modal.classList.add('hidden');
        }
        this.editingTaskId = null;
        console.log('Task modal closed');
    }

    // Fixed toggleRecurringOptions to work with checkbox
    toggleRecurringOptions(show) {
        const options = document.getElementById('recurringOptions');
        if (options) {
            if (show) {
                options.style.display = 'block';
            } else {
                options.style.display = 'none';
            }
        }
    }

    saveTask(event) {
        event.preventDefault();

        const taskTitle = document.getElementById('taskTitle');
        const taskComment = document.getElementById('taskComment');
        const taskDueDate = document.getElementById('taskDueDate');
        const taskRecurring = document.getElementById('taskRecurring');
        const taskFrequency = document.getElementById('taskFrequency');

        const title = taskTitle ? taskTitle.value.trim() : '';
        const comment = taskComment ? taskComment.value.trim() : '';
        const dueDate = taskDueDate ? taskDueDate.value : '';
        const isRecurring = taskRecurring ? taskRecurring.checked : false;
        const frequency = taskFrequency ? taskFrequency.value : 'daily';

        // Get selected priority from radio buttons
        const selectedPriorityRadio = document.querySelector('input[name="taskPriority"]:checked');
        const priority = selectedPriorityRadio ? selectedPriorityRadio.value : 'medium';

        if (!title || !dueDate) {
            alert('Veuillez remplir tous les champs obligatoires.');
            return;
        }

        const taskData = {
            title,
            comment,
            priority,
            dueDate,
            recurring: {
                enabled: isRecurring,
                frequency: isRecurring ? frequency : null
            }
        };

        if (this.editingTaskId) {
            this.updateTask(this.editingTaskId, taskData);
            console.log('Task updated:', taskData);
        } else {
            this.createTask(taskData);
            console.log('New task created:', taskData);
        }

        this.closeTaskModal();
        this.saveTasks();
        this.renderCalendar();
    }

    createTask(taskData) {
        const task = {
            id: this.generateId(),
            ...taskData,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.tasks.push(task);
        console.log('New task created:', task);
    }

    updateTask(taskId, taskData) {
        const taskIndex = this.tasks.findIndex(t => t.id === taskId);
        if (taskIndex !== -1) {
            this.tasks[taskIndex] = { ...this.tasks[taskIndex], ...taskData };
            console.log('Task updated:', this.tasks[taskIndex]);
        }
    }

    openTaskDetailModal(taskId) {
        console.log('Opening task detail modal for:', taskId);
        const task = this.tasks.find(t => t.id === taskId);

        if (!task) {
            console.error('Task not found for detail modal:', taskId);
            return;
        }

        this.editingTaskId = taskId;
        const modal = document.getElementById('taskDetailModal');
        const content = document.getElementById('taskDetailContent');
        const toggleBtn = document.getElementById('toggleCompleteBtn');

        if (!modal || !content) {
            console.error('Task detail modal elements not found');
            return;
        }

        const priorityColors = {
            'critical': '#ef4444',
            'high': '#f97316',
            'medium': '#eab308',
            'low': '#22c55e'
        };

        const priorityLabels = {
            'critical': 'CRITIQUE',
            'high': 'HAUTE',
            'medium': 'MOYENNE',
            'low': 'FAIBLE'
        };

        const frequencyLabels = {
            'daily': 'Quotidien',
            'weekly': 'Hebdomadaire',
            'monthly': 'Mensuel'
        };

        content.innerHTML = `
            <div style="border-left: 4px solid ${priorityColors[task.priority]}; padding-left: 16px; margin-bottom: 16px;">
                <h4 style="margin: 0 0 8px 0; font-size: 18px;">${this.escapeHtml(task.title)}</h4>
                <div style="display: flex; gap: 12px; margin-bottom: 12px; flex-wrap: wrap;">
                    <span class="status status--${task.priority === 'critical' ? 'error' : task.priority === 'high' ? 'warning' : 'info'}">${priorityLabels[task.priority]}</span>
                    ${task.completed ? '<span class="status status--success">TERMINÉE</span>' : '<span class="status status--info">EN COURS</span>'}
                    ${task.recurring?.enabled ? '<span class="status status--info">RÉCURRENTE</span>' : ''}
                </div>
                ${task.comment ? `<p style="margin: 12px 0; color: var(--color-text-secondary);">${this.escapeHtml(task.comment)}</p>` : ''}
            </div>
            <div style="font-size: 14px; color: var(--color-text-secondary);">
                <p><strong>Date d'Échéance:</strong> ${new Date(task.dueDate).toLocaleDateString('fr-FR')}</p>
                ${task.recurring?.enabled ? `<p><strong>Répétition:</strong> ${frequencyLabels[task.recurring.frequency]}</p>` : ''}
                <p><strong>Créée:</strong> ${new Date(task.createdAt).toLocaleString('fr-FR')}</p>
                ${task.completedAt ? `<p><strong>Terminée:</strong> ${new Date(task.completedAt).toLocaleString('fr-FR')}</p>` : ''}
            </div>
        `;

        if (toggleBtn) {
            toggleBtn.textContent = task.completed ? 'Marquer En Cours' : 'Marquer Terminée';
            toggleBtn.className = task.completed ? 'btn btn--outline' : 'btn btn--primary';
        }

        modal.classList.remove('hidden');
        console.log('Task detail modal opened successfully');
    }

    closeTaskDetailModal() {
        const modal = document.getElementById('taskDetailModal');
        if (modal) {
            modal.classList.add('hidden');
        }
        this.editingTaskId = null;
    }

    // CORRECTION: Bug d'édition résolu (bug 2)
    editCurrentTask() {
        console.log('Edit current task button clicked for:', this.editingTaskId);
        const taskIdToEdit = this.editingTaskId; // Sauvegarder l'ID AVANT de fermer le modal
        this.closeTaskDetailModal();
        this.openTaskModal(taskIdToEdit); // Utiliser l'ID sauvegardé
    }

    deleteCurrentTask() {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
            this.tasks = this.tasks.filter(t => t.id !== this.editingTaskId);
            this.saveTasks();
            this.closeTaskDetailModal();
            this.renderCalendar();
        }
    }

    toggleCurrentTaskComplete() {
        const task = this.tasks.find(t => t.id === this.editingTaskId);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;

            if (task.completed && task.recurring?.enabled) {
                this.createRecurringTask(task);
            }

            this.saveTasks();
            this.closeTaskDetailModal();
            this.renderCalendar();
        }
    }

    updateStatistics() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;
        const critical = this.tasks.filter(t => t.priority === 'critical' && !t.completed).length;

        const totalEl = document.getElementById('totalTasks');
        const completedEl = document.getElementById('completedTasks');
        const pendingEl = document.getElementById('pendingTasks');
        const criticalEl = document.getElementById('criticalTasks');

        if (totalEl) totalEl.textContent = total;
        if (completedEl) completedEl.textContent = completed;
        if (pendingEl) pendingEl.textContent = pending;
        if (criticalEl) criticalEl.textContent = critical;
    }

    toggleDropdown() {
        const dropdown = document.querySelector('.dropdown');
        if (dropdown) {
            dropdown.classList.toggle('active');
        }
    }

    exportTasks() {
        const xml = this.tasksToXML();
        const blob = new Blob([xml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `taches_${new Date().toISOString().split('T')[0]}.xml`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        const dropdown = document.querySelector('.dropdown');
        if (dropdown) dropdown.classList.remove('active');
    }

    tasksToXML() {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<taskData>\n<tasks>\n';

        this.tasks.forEach(task => {
            xml += '<task id="' + task.id + '">\n';
            xml += '<title><![CDATA[' + task.title + ']]></title>\n';
            xml += '<comment><![CDATA[' + task.comment + ']]></comment>\n';
            xml += '<priority>' + task.priority + '</priority>\n';
            xml += '<dueDate>' + task.dueDate + '</dueDate>\n';
            xml += '<completed>' + task.completed + '</completed>\n';
            xml += '<recurring enabled="' + (task.recurring?.enabled || false) + '"' + (task.recurring?.frequency ? ' frequency="' + task.recurring.frequency + '"' : '') + '></recurring>\n';
            xml += '<createdAt>' + task.createdAt + '</createdAt>\n';
            if (task.completedAt) {
                xml += '<completedAt>' + task.completedAt + '</completedAt>\n';
            }
            xml += '</task>\n';
        });

        xml += '</tasks>\n</taskData>';
        return xml;
    }

    triggerImport() {
        const importFile = document.getElementById('importFile');
        if (importFile) {
            importFile.click();
        }

        const dropdown = document.querySelector('.dropdown');
        if (dropdown) dropdown.classList.remove('active');
    }

    importTasks(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const xmlContent = e.target.result;
                const importedTasks = this.parseXMLToTasks(xmlContent);

                if (confirm(`Importer ${importedTasks.length} tâches ? Ceci s'ajoutera aux tâches existantes.`)) {
                    this.tasks.push(...importedTasks);
                    this.saveTasks();
                    this.renderCalendar();
                    alert('Tâches importées avec succès !');
                }
            } catch (error) {
                alert('Erreur lors de l\'importation des tâches. Veuillez vérifier le format XML.');
                console.error('Import error:', error);
            }
        };

        reader.readAsText(file);

        // Reset file input
        event.target.value = '';
    }

    parseXMLToTasks(xmlString) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
        const taskNodes = xmlDoc.getElementsByTagName('task');
        const tasks = [];

        for (let i = 0; i < taskNodes.length; i++) {
            const taskNode = taskNodes[i];
            const recurringNode = taskNode.getElementsByTagName('recurring')[0];

            const task = {
                id: taskNode.getAttribute('id') || this.generateId(),
                title: taskNode.getElementsByTagName('title')[0]?.textContent || '',
                comment: taskNode.getElementsByTagName('comment')[0]?.textContent || '',
                priority: taskNode.getElementsByTagName('priority')[0]?.textContent || 'medium',
                dueDate: taskNode.getElementsByTagName('dueDate')[0]?.textContent || '',
                completed: taskNode.getElementsByTagName('completed')[0]?.textContent === 'true',
                recurring: {
                    enabled: recurringNode?.getAttribute('enabled') === 'true',
                    frequency: recurringNode?.getAttribute('frequency') || null
                },
                createdAt: taskNode.getElementsByTagName('createdAt')[0]?.textContent || new Date().toISOString()
            };

            const completedAtNode = taskNode.getElementsByTagName('completedAt')[0];
            if (completedAtNode) {
                task.completedAt = completedAtNode.textContent;
            }

            tasks.push(task);
        }

        return tasks;
    }

    // Utility functions
    generateId() {
        return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // CORRECTION: Nouvelles fonctions de formatage de date pour éviter problèmes de fuseau (bug 1)
    formatDateForStorage(date) {
        // Utilise le fuseau horaire local pour éviter les décalages
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    formatDateForInput(date) {
        // Format pour les inputs HTML date
        return this.formatDateForStorage(date);
    }

    formatDateRange(start, end) {
        const options = { day: 'numeric', month: 'short' };
        if (start.getFullYear() !== end.getFullYear()) {
            options.year = 'numeric';
        }
        return start.toLocaleDateString('fr-FR', options) + ' - ' + end.toLocaleDateString('fr-FR', options) + ' ' + end.getFullYear();
    }

    // CORRECTION: Fonction getStartOfWeek complètement réécrite (bug 1)
    getStartOfWeek(date) {
        // Créer une nouvelle date pour éviter de modifier l'originale
        const result = new Date(date);

        // Obtenir le jour de la semaine (0 = dimanche, 1 = lundi, etc.)
        const dayOfWeek = result.getDay();

        // Calculer le nombre de jours à soustraire pour arriver au lundi
        // Si c'est dimanche (0), on recule de 6 jours
        // Si c'est lundi (1), on recule de 0 jour
        // Si c'est mardi (2), on recule de 1 jour, etc.
        const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

        // Soustraire les jours pour arriver au lundi
        result.setDate(result.getDate() - daysToSubtract);

        return result;
    }

    isWeekend(date) {
        const day = date.getDay();
        return day === 0 || day === 6;
    }

    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text || '';
        return div.innerHTML;
    }
}

// Initialize the application - Ensure it runs after DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM loaded, initializing Task Manager...');
        window.taskManager = new TaskManager();
    });
} else {
    console.log('DOM already loaded, initializing Task Manager...');
    window.taskManager = new TaskManager();
}
