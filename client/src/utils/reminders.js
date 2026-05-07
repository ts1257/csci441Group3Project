let reminderIntervalId = null;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function currentTimeKey() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function getNotifiedSet() {
  try {
    return new Set(JSON.parse(localStorage.getItem("mpp-reminders-notified") || "[]"));
  } catch {
    return new Set();
  }
}

function saveNotifiedSet(set) {
  localStorage.setItem("mpp-reminders-notified", JSON.stringify([...set].slice(-200)));
}

function normalizeList(data, key) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function notifyUser(title, body) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: "/favicon.svg",
      tag: `${title}-${body}`,
    });
    return;
  }

  window.dispatchEvent(
    new CustomEvent("wellness-reminder", {
      detail: { title, body },
    }),
  );
}

async function loadReminderData() {
  const token = localStorage.getItem("token");
  if (!token) return { habits: [], tasks: [] };

  const headers = { Authorization: `Bearer ${token}` };
  const [habitResponse, taskResponse] = await Promise.allSettled([
    fetch(`${import.meta.env.VITE_API_URL}/api/habits`, { headers }),
    fetch(`${import.meta.env.VITE_API_URL}/api/tasks`, { headers }),
  ]);

  let habits = [];
  let tasks = [];

  if (habitResponse.status === "fulfilled" && habitResponse.value.ok) {
    habits = normalizeList(await habitResponse.value.json(), "habits");
  }

  if (taskResponse.status === "fulfilled" && taskResponse.value.ok) {
    tasks = normalizeList(await taskResponse.value.json(), "tasks");
  }

  return { habits, tasks };
}

export async function checkWellnessReminders() {
  if (typeof window === "undefined") return;

  const nowTime = currentTimeKey();
  const date = todayKey();
  const notified = getNotifiedSet();

  try {
    const { habits, tasks } = await loadReminderData();

    habits
      .filter((habit) => habit.reminderTime === nowTime && !habit.completedToday)
      .forEach((habit) => {
        const key = `${date}:habit:${habit._id}:${habit.reminderTime}`;
        if (notified.has(key)) return;
        notified.add(key);
        notifyUser("Wellness Habit Reminder", `${habit.name} is scheduled for ${habit.reminderTime}.`);
      });

    tasks
      .filter(
        (task) =>
          task.persona === "wellness" &&
          task.taskType === "medicine" &&
          task.reminderTime === nowTime &&
          task.status !== "completed",
      )
      .forEach((task) => {
        const key = `${date}:task:${task._id}:${task.reminderTime}`;
        if (notified.has(key)) return;
        notified.add(key);
        notifyUser("Medicine Reminder", `${task.title} is scheduled for ${task.reminderTime}.`);
      });

    saveNotifiedSet(notified);
  } catch {
    // Reminder checks should never break the app.
  }
}

export function getReminderPermission() {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}

export async function requestReminderPermission() {
  if (!("Notification" in window)) return "unsupported";
  const result = await Notification.requestPermission();
  window.dispatchEvent(new CustomEvent("reminder-permission-change", { detail: { permission: result } }));
  return result;
}

export function startWellnessReminders() {
  if (typeof window === "undefined" || reminderIntervalId) return;

  checkWellnessReminders();
  reminderIntervalId = setInterval(checkWellnessReminders, 30000);

  window.addEventListener("focus", checkWellnessReminders);
  window.addEventListener("online", checkWellnessReminders);
}
