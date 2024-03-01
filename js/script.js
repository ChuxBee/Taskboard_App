// Retrieve tasks and nextId from localStorage
let taskList = JSON.parse(localStorage.getItem("tasks")) || []; // Retrieve tasks from localStorage or initialize an empty array if no tasks found
let nextId = JSON.parse(localStorage.getItem("nextId")) || 1; // Retrieve nextId from localStorage or initialize it to 1 if not found

// Todo: create a function to generate a unique task id
function generateTaskId() {
    return nextId++; // Increment nextId and return the new value
}

// Todo: create a function to create a task card
function createTaskCard(task) {
    // Parse deadline string into date components
    let now = new Date();
    let deadlineParts = task.deadline.split('/');
    let formattedDeadline = `${deadlineParts[2]}-${deadlineParts[1]}-${deadlineParts[0]}`;
    let deadlineDate = new Date(formattedDeadline);

    // Calculate time difference between current date and deadline
    let timeDifference = Math.abs(deadlineDate.getTime() - now.getTime());
    let oneDay = 1000 * 60 * 60 * 24; // milliseconds in a day
    let daysDifference = Math.ceil(timeDifference / oneDay); // Calculate difference in days

    // Determine deadline class based on days difference
    let deadlineClassBg;
    if (daysDifference <= 2) {
        deadlineClassBg = "bg-warning"; // Due in 2 days or less
    } else if (deadlineDate < now) {
        deadlineClassBg = "bg-danger"; // Past due
    } else {
        deadlineClassBg = "bg-success"; // Due in more than 2 days
    }

    // Create HTML card with task details
    let card = `
    <div id="task-${task.id}" class="task-card card mb-3 ${deadlineClassBg}">
        <div class="text-white card-header">${task.title}</div>
        <div class="text-white card-body">
            <p class="text-white card-text">${task.description}</p>
            <p class="text-white card-text">Deadline: ${task.deadline}</p>
            <button class="btn btn-danger delete-task border" data-task-id="${task.id}">Delete</button>
        </div>
    </div>`;
    return card; // Return the HTML card
}

// Todo: create a function to render the task list
function renderTaskList() {
    setTimeout(() => {
        // Empty task containers
        $('#todo-cards').empty();
        $('#in-progress-cards').empty();
        $('#done-cards').empty();
        
        // Render each task card based on its status
        taskList.forEach(task => {
            let card = createTaskCard(task);
            $(`#${task.status}-cards`).append(card); // Append card to the corresponding status container
        });

        makeCardsDraggable(); // Make cards draggable after rendering
    }, 20);
}

// Todo: create a function to make cards draggable
function makeCardsDraggable() {
    $('.task-card').draggable({
        revert: function (event, ui) {
            if (ui && ui.helper) {
                // Check if the card is being dropped onto a valid lane
                let droppedOnValidLane = $(ui.helper).hasClass('lane');

                // If the card is not dropped onto a valid lane, revert to the original position
                if (!droppedOnValidLane) {
                    return true; // Revert
                } else {
                    return false; // Don't revert
                }
            } else {
                return true; // Revert if ui or ui.helper is undefined
            }
        },
        stack: '.task-card',
        containment: '.swim-lanes'
    });
}

// Todo: create a function to handle adding a new task
function handleAddTask(event) {
    event.preventDefault();

    // Get task details from form inputs
    let title = $('#title').val();
    let description = $('#description').val();
    let deadline = $('#deadline-date').val();

    // Check if all fields are filled
    if (title && description && deadline) {
        // Create new task object
        let newTask = {
            id: generateTaskId(),
            title: title,
            description: description,
            deadline: deadline,
            status: 'todo'
        };

        // Add new task to taskList array and update localStorage
        taskList.push(newTask);
        localStorage.setItem('tasks', JSON.stringify(taskList));
        localStorage.setItem('nextId', nextId);

        renderTaskList(); // Render updated task list
        $('#formModal').modal('hide'); // Hide form modal
        swal({
            title: "Task Created Successfully 🎊🎉",
            icon: "success"
        }); // Alert user for successful new task creation
    } else {
        swal({
            title: "Please fill in all fields.",
            icon: "warning"
        }); // Alert if any field is empty
    }
}

// Todo: create a function to handle deleting a task
function handleDeleteTask(event) {
    let taskId = $(this).data('task-id');
    // Filter out the task to be deleted from the taskList array
    taskList = taskList.filter(task => task.id !== taskId);
    localStorage.setItem('tasks', JSON.stringify(taskList)); // Update localStorage
    swal({
        title: "Task Deleted Successfully",
        icon: "success"
    }); // Show success message
    renderTaskList(); // Render updated task list
}

// Todo: create a function to handle dropping a task into a new status lane
function handleDrop(event, ui) {
    let taskId = ui.draggable.attr('id').split('-')[1];
    let newStatus = $(this).attr('id');

    // Retrieve the current status of the task being dragged
    let currentStatus = ui.draggable.closest('.lane').attr('id');

    // Check if the task is being moved from 'In Progress' or 'Done' to 'To Do'
    if ((currentStatus === 'in-progress' || currentStatus === 'done') && (newStatus === 'to-do' || newStatus === 'todo')) {
        swal({
            title: "Task can't be returned to To-do! Task progress counts.",
            icon: "warning"
        }); // Alert user
        return; // Prevent further processing
    }

    // Update the task status only if it's not being moved back to 'To Do' from 'In Progress' or 'Done'
    taskList.forEach(task => {
        if (task.id == taskId) {
            task.status = newStatus;
        }
    });

    localStorage.setItem('tasks', JSON.stringify(taskList)); // Update localStorage
    renderTaskList(); // Render updated task list
}

// Todo: when the page loads, render the task list, add event listeners, make lanes droppable, and make the due date field a date picker
$(document).ready(function () {
    renderTaskList(); // Render initial task list

    // Event listeners
    $('#formModal').on('hidden.bs.modal', function () {
        $(this).find('form')[0].reset(); // Reset form fields when modal is hidden
    });

    // Add New Task
    $('#formModal').on('submit', handleAddTask);

    // Delete Task
    $(document).on('click', '.delete-task', handleDeleteTask);

    // Make lanes droppable
    $('.lane').droppable({
        accept: '.task-card',
        drop: handleDrop
    });

    // Make the due date field a date picker
    $('#deadline-date').datepicker({
        dateFormat: 'dd/mm/yy',
        minDate: 0,
    });
});
