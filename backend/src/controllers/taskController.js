import Task from "../models/Task.js";

export async function createTask(req, res, next) {
  try {
    const { title, description, dueDate, priority, status, persona, courseId, projectId, taskType, reminderTime, tripId } = req.body;

    if (!title || !persona) {
      return res.status(400).json({
        message: "Task title and persona are required",
      });
    }

    const task = await Task.create({
      user: req.user.userId,
      persona,
      title: title.trim(),
      description: description?.trim() || "",
      dueDate: dueDate || null,
      priority: priority || "medium",
      status: status || "todo",
      courseId: courseId?.trim() || "",
      projectId: projectId?.trim() || "",
      taskType: taskType || "general",
      reminderTime: reminderTime?.trim() || "",
      tripId: tripId?.trim() || "",
    });

    res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    next(error);
  }
}

export async function getTasks(req, res, next) {
  try {
    const { persona, status, priority } = req.query;

    const filter = {
      user: req.user.userId,
    };

    if (persona) filter.persona = persona;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const tasks = await Task.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      tasks,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateTask(req, res, next) {
  try {
    const { id } = req.params;
    const { title, description, dueDate, priority, status, persona, courseId, projectId, taskType, reminderTime, tripId } = req.body;

    const task = await Task.findOne({
      _id: id,
      user: req.user.userId,
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    if (persona !== undefined) task.persona = persona;
    if (title !== undefined) task.title = title.trim();
    if (description !== undefined) task.description = description.trim();
    if (dueDate !== undefined) task.dueDate = dueDate || null;
    if (priority !== undefined) task.priority = priority;
    if (status !== undefined) task.status = status;
    if (courseId !== undefined) task.courseId = courseId.trim();
    if (projectId !== undefined) task.projectId = projectId.trim();
    if (taskType !== undefined) task.taskType = taskType;
    if (reminderTime !== undefined) task.reminderTime = reminderTime.trim();
    if (tripId !== undefined) task.tripId = tripId.trim();

    const updatedTask = await task.save();

    res.status(200).json({
      message: "Task updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteTask(req, res, next) {
  try {
    const { id } = req.params;

    const task = await Task.findOne({
      _id: id,
      user: req.user.userId,
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    await task.deleteOne();

    res.status(200).json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}