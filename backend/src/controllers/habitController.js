import Habit from "../models/Habit.js";

function shouldAutoComplete(progress, goal) {
  const progressNumber = Number(progress);
  const goalNumber = Number(goal);

  return Number.isFinite(progressNumber) && Number.isFinite(goalNumber) && goalNumber > 0 && progressNumber >= goalNumber;
}

function getCompletedProgress(progress, goal) {
  const goalNumber = Number(goal);

  if (Number.isFinite(goalNumber) && goalNumber > 0) {
    return String(goalNumber);
  }

  return progress || "0";
}

function getNotDoneProgress(progress, goal) {
  const goalNumber = Number(goal);
  const progressNumber = Number(progress);

  if (Number.isFinite(goalNumber) && goalNumber > 0) {
    return String(Math.max(goalNumber - 1, 0));
  }

  if (Number.isFinite(progressNumber)) {
    return String(Math.max(progressNumber - 1, 0));
  }

  return "0";
}

export async function createHabit(req, res, next) {
  try {
    const { name, category, goal, progress, unit, reminderTime, completedToday } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Habit name is required" });
    }

    const habit = await Habit.create({
      user: req.user.userId,
      name: name.trim(),
      category: category || "other",
      goal: goal?.trim() || "",
      progress: Boolean(completedToday) ? getCompletedProgress(progress?.trim() || "", goal) : progress?.trim() || "",
      unit: unit?.trim() || "",
      reminderTime: reminderTime?.trim() || "",
      completedToday: shouldAutoComplete(progress, goal) || Boolean(completedToday),
    });

    res.status(201).json({ message: "Habit created successfully", habit });
  } catch (error) {
    next(error);
  }
}

export async function getHabits(req, res, next) {
  try {
    const habits = await Habit.find({ user: req.user.userId }).sort({ createdAt: -1 });
    res.status(200).json({ habits });
  } catch (error) {
    next(error);
  }
}

export async function updateHabit(req, res, next) {
  try {
    const { id } = req.params;
    const { name, category, goal, progress, unit, reminderTime, completedToday } = req.body;

    const habit = await Habit.findOne({ _id: id, user: req.user.userId });

    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }

    if (name !== undefined) habit.name = name.trim();
    if (category !== undefined) habit.category = category;
    if (goal !== undefined) habit.goal = goal.trim();
    if (progress !== undefined) habit.progress = progress.trim();
    if (unit !== undefined) habit.unit = unit.trim();
    if (reminderTime !== undefined) habit.reminderTime = reminderTime.trim();
    if (completedToday !== undefined) {
      habit.completedToday = Boolean(completedToday);

      if (completedToday === true && progress === undefined) {
        habit.progress = getCompletedProgress(habit.progress, habit.goal);
      }

      if (completedToday === false && progress === undefined) {
        habit.progress = getNotDoneProgress(habit.progress, habit.goal);
      }
    }

    if (shouldAutoComplete(habit.progress, habit.goal)) {
      habit.completedToday = true;
    }

    if (completedToday === false && !shouldAutoComplete(habit.progress, habit.goal)) {
      habit.completedToday = false;
    }

    const updatedHabit = await habit.save();
    res.status(200).json({ message: "Habit updated successfully", habit: updatedHabit });
  } catch (error) {
    next(error);
  }
}

export async function deleteHabit(req, res, next) {
  try {
    const { id } = req.params;

    const habit = await Habit.findOne({ _id: id, user: req.user.userId });

    if (!habit) {
      return res.status(404).json({ message: "Habit not found" });
    }

    await habit.deleteOne();
    res.status(200).json({ message: "Habit deleted successfully" });
  } catch (error) {
    next(error);
  }
}
