'use client';

import { useEffect, useMemo, useState } from 'react';
import { CreateModal, type TaskFormData } from '../ui/create-modal';
import { supabaseClient } from '../../src/lib/supabase/client';

type TaskStatus = 'Not Started' | 'In Progress' | 'Completed';

type Task = {
  id: string;
  name: string;
  category: string;
  dueDate: string;
  description: string;
  status: TaskStatus;
};

const guestTasks: Task[] = [
  { id: 'task-1', name: 'Prepare design review', category: 'Product Design', dueDate: 'Apr 9, 2026', description: 'Finalize slides before the review.', status: 'Not Started' },
  { id: 'task-2', name: 'Write meeting recap', category: 'Team Ops', dueDate: 'Apr 11, 2026', description: 'Summarize action items from standup.', status: 'In Progress' },
  { id: 'task-3', name: 'Submit assignment draft', category: 'Business Analytics', dueDate: 'Apr 13, 2026', description: 'Send the draft to the professor.', status: 'Completed' }
];

const TASK_STORAGE_KEY = 'tasktrack-tasks';
const DEMO_TASK_IDS = new Set(['task-1', 'task-2', 'task-3']);

function normalizeStatus(status?: string): TaskStatus {
  if (!status) return 'Not Started';
  const n = status.toLowerCase();
  if (n === 'completed' || n === 'complete') return 'Completed';
  if (n === 'in progress' || n === 'inprogress') return 'In Progress';
  return 'Not Started';
}

function normalizeTask(task: Task): Task {
  return { ...task, status: normalizeStatus(task.status) };
}

function persist(tasks: Task[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasks));
  try {
    window.dispatchEvent(new CustomEvent('tasktrack-tasks-updated', { detail: tasks }));
  } catch {
    const ev: any = document.createEvent('CustomEvent');
    ev.initCustomEvent('tasktrack-tasks-updated', false, false, tasks);
    window.dispatchEvent(ev);
  }
}

const statusStyles: Record<TaskStatus, string> = {
  'Not Started': 'bg-surface-container-high text-on-surface-variant',
  'In Progress': 'bg-brand-100 text-brand-700',
  Completed: 'bg-sage-50 text-sage-600',
};

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Always write to localStorage so navigation never loses data.
  // Supabase is the sync target; localStorage is the persistent cache.
  const applyTasks = (list: Task[]) => {
    setTasks(list);
    persist(list);
  };

  const loadFromSupabase = async (uid: string) => {
    const { data, error } = await supabaseClient
      .from('tasks')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: true });
    if (!error && data) {
      const mapped: Task[] = data.map((row: any) => ({
        id: row.id,
        name: row.name,
        category: row.category,
        dueDate: row.due_date,
        description: row.description,
        status: normalizeStatus(row.status),
      }));
      applyTasks(mapped);
    } else {
      // Supabase unavailable — use localStorage cache, but never show demo data to real users
      if (typeof window !== 'undefined') {
        try {
          const raw = window.localStorage.getItem(TASK_STORAGE_KEY);
          const stored: Task[] = raw ? JSON.parse(raw) : [];
          const real = stored.filter((t) => !DEMO_TASK_IDS.has(t.id)).map(normalizeTask);
          applyTasks(real);
          return;
        } catch {}
      }
      applyTasks([]);
    }
  };

  const loadFromLocalStorage = () => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(TASK_STORAGE_KEY);
    let toUse = guestTasks;
    if (raw) {
      try {
        const stored = JSON.parse(raw) as Task[];
        if (stored.length > 0) toUse = stored.map(normalizeTask);
      } catch {}
    }
    setTasks(toUse);
    persist(toUse);
  };

  useEffect(() => {
    let cancelled = false;

    supabaseClient.auth.getUser().then(({ data }: any) => {
      if (cancelled) return;
      const uid: string | null = data.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        loadFromSupabase(uid);
      } else {
        loadFromLocalStorage();
      }
    });

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event: any, session: any) => {
      if (cancelled) return;
      const uid: string | null = session?.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        loadFromSupabase(uid);
      } else {
        loadFromLocalStorage();
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    const updated = tasks.map((t) => (t.id === taskId ? { ...t, status } : t));
    applyTasks(updated); // localStorage updated immediately — no rollback on Supabase errors

    if (userId) {
      await supabaseClient.from('tasks').update({ status }).eq('id', taskId).eq('user_id', userId);
    }
  };

  const handleCreateTask = async (formData: TaskFormData) => {
    const dueDateTime = formData.date && formData.time ? `${formData.date} ${formData.time}` : formData.date;
    const parsedDate = new Date(dueDateTime);

    const newTask: Task = {
      id: `task-${Date.now()}`,
      name: formData.title.trim(),
      category: formData.category,
      dueDate: parsedDate.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      description: formData.description || 'No description provided.',
      status: 'Not Started',
    };

    const updated = [...tasks, newTask];
    applyTasks(updated); // write to localStorage immediately so navigation preserves it

    if (userId) {
      await supabaseClient.from('tasks').insert({
        id: newTask.id,
        user_id: userId,
        name: newTask.name,
        category: newTask.category,
        due_date: newTask.dueDate,
        description: newTask.description,
        status: newTask.status,
      });
    }

    setIsModalOpen(false);
  };

  const handleDeleteTask = async (taskId: string) => {
    const updated = tasks.filter((t) => t.id !== taskId);
    applyTasks(updated); // localStorage is already updated — never roll back on Supabase errors

    if (userId) {
      await supabaseClient.from('tasks').delete().eq('id', taskId).eq('user_id', userId);
    }
  };

  const statusGroups = useMemo(
    () => ({
      'Not Started': tasks.filter((t) => t.status === 'Not Started'),
      'In Progress': tasks.filter((t) => t.status === 'In Progress'),
      Completed: tasks.filter((t) => t.status === 'Completed'),
    }),
    [tasks]
  );

  return (
    <>
      <div className="rounded-3xl border border-outline-variant bg-white p-8 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-on-surface">Task list</h2>
            <p className="mt-2 text-on-surface-variant">Manage tasks for courses, projects, and personal work.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            Add new task
          </button>
        </div>

        <div className="mt-8 space-y-6">
          {(['Not Started', 'In Progress', 'Completed'] as TaskStatus[]).map((section) => (
            <div key={section} className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-on-surface">{section}</h3>
                <span className="rounded-full bg-surface-container-high px-2.5 py-0.5 text-xs font-semibold text-on-surface-variant">
                  {statusGroups[section].length}
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {statusGroups[section].length === 0 && (
                  <p className="text-sm italic text-outline">No {section.toLowerCase()} tasks yet.</p>
                )}
                {statusGroups[section].map((task) => (
                  <div key={task.id} className="rounded-2xl border border-outline-variant bg-white p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex-1">
                        <h4 className="text-base font-semibold text-on-surface">{task.name}</h4>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.15em] text-outline">{task.category}</p>
                        <p className="mt-2 text-sm text-on-surface-variant">{task.description}</p>
                      </div>
                      <div className="flex flex-col items-start gap-3 sm:items-end">
                        <div className="flex flex-col gap-2 sm:items-end">
                          <label className="text-xs font-semibold uppercase tracking-[0.2em] text-outline">Status</label>
                          <select
                            value={task.status}
                            onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                            className="rounded-full border border-outline-variant bg-surface-container-low px-4 py-2 text-sm text-on-surface focus:border-brand-500 focus:outline-none"
                          >
                            <option>Not Started</option>
                            <option>In Progress</option>
                            <option>Completed</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[task.status]}`}>
                            {task.status}
                          </span>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="rounded-full bg-blush-50 px-3 py-1 text-xs font-semibold text-blush-700 transition hover:bg-blush-100"
                          >
                            Delete
                          </button>
                        </div>
                        <p className="text-sm text-outline">Due {task.dueDate}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <CreateModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleCreateTask} type="task" />
    </>
  );
}
