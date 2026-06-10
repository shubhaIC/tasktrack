'use client';

import { useEffect, useState } from 'react';
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

type Course = {
  id: string;
  name: string;
  description: string;
  color: string;
};

const guestCourses: Course[] = [
  { id: 'course-1', name: 'Product Design', description: 'Design sprints and review cycles.', color: 'bg-sage-50 text-sage-600' },
  { id: 'course-2', name: 'Business Analytics', description: 'Project planning and reporting.', color: 'bg-brand-100 text-brand-700' },
  { id: 'course-3', name: 'Team Ops', description: 'Operations tasks and collaboration.', color: 'bg-blush-50 text-blush-700' }
];

const COURSE_COLORS = [
  'bg-sage-50 text-sage-600',
  'bg-brand-100 text-brand-700',
  'bg-blush-50 text-blush-700',
  'bg-surface-container-high text-on-surface-variant',
];

const COURSE_STORAGE_KEY = 'tasktrack-courses';
const TASK_STORAGE_KEY = 'tasktrack-tasks';
const DEMO_COURSE_IDS = new Set(['course-1', 'course-2', 'course-3']);

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

function dispatchCoursesUpdated(courses: Course[]) {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent('tasktrack-courses-updated', { detail: courses }));
  } catch {}
}

const statusStyles: Record<TaskStatus, string> = {
  'Not Started': 'bg-surface-container-high text-on-surface-variant',
  'In Progress': 'bg-brand-100 text-brand-700',
  Completed: 'bg-sage-50 text-sage-600',
};

export function CourseList() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');

  const loadCoursesFromSupabase = async (uid: string) => {
    const { data, error } = await supabaseClient
      .from('courses')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: true });
    if (!error && data) {
      const mapped: Course[] = data.map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        color: row.color,
      }));
      // Cache to localStorage so navigation + task modal can always find it
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(COURSE_STORAGE_KEY, JSON.stringify(mapped));
      }
      setCourses(mapped);
      dispatchCoursesUpdated(mapped);
    } else {
      // Supabase unavailable — use localStorage cache, but never show demo data to real users
      if (typeof window !== 'undefined') {
        try {
          const raw = window.localStorage.getItem(COURSE_STORAGE_KEY);
          const stored: Course[] = raw ? JSON.parse(raw) : [];
          const real = stored.filter((c) => !DEMO_COURSE_IDS.has(c.id));
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(COURSE_STORAGE_KEY, JSON.stringify(real));
          }
          setCourses(real);
          dispatchCoursesUpdated(real);
          return;
        } catch {}
      }
      setCourses([]);
      dispatchCoursesUpdated([]);
    }
  };

  const loadCoursesFromLocalStorage = () => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(COURSE_STORAGE_KEY);
    let toUse = guestCourses;
    if (raw) {
      try {
        const stored = JSON.parse(raw) as Course[];
        if (stored.length > 0) toUse = stored;
      } catch {}
    }
    setCourses(toUse);
    dispatchCoursesUpdated(toUse);
  };

  const loadTasksFromLocalStorage = () => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(TASK_STORAGE_KEY);
    if (!raw) { setTasks([]); return; }
    try { setTasks((JSON.parse(raw) as Task[]).map(normalizeTask)); } catch {}
  };

  useEffect(() => {
    let cancelled = false;

    supabaseClient.auth.getUser().then(({ data }: any) => {
      if (cancelled) return;
      const uid: string | null = data.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        loadCoursesFromSupabase(uid);
      } else {
        loadCoursesFromLocalStorage();
      }
    });

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event: any, session: any) => {
      if (cancelled) return;
      const uid: string | null = session?.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        loadCoursesFromSupabase(uid);
      } else {
        loadCoursesFromLocalStorage();
      }
    });

    loadTasksFromLocalStorage();

    const handleTasksUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (Array.isArray(detail)) {
        setTasks(detail.map(normalizeTask));
      } else {
        loadTasksFromLocalStorage();
      }
    };

    window.addEventListener('tasktrack-tasks-updated', handleTasksUpdate as EventListener);
    window.addEventListener('storage', loadTasksFromLocalStorage);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.removeEventListener('tasktrack-tasks-updated', handleTasksUpdate as EventListener);
      window.removeEventListener('storage', loadTasksFromLocalStorage);
    };
  }, []);

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCourseName.trim();
    if (!name) return;

    const color = COURSE_COLORS[courses.length % COURSE_COLORS.length];
    const newCourse: Course = {
      id: `course-${Date.now()}`,
      name,
      description: '',
      color,
    };

    const updated = [...courses, newCourse];
    setCourses(updated);
    dispatchCoursesUpdated(updated);
    // Always write to localStorage so task/meeting modals can find the new course
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(COURSE_STORAGE_KEY, JSON.stringify(updated));
    }

    if (userId) {
      await supabaseClient.from('courses').insert({
        id: newCourse.id,
        user_id: userId,
        name: newCourse.name,
        description: newCourse.description,
        color: newCourse.color,
      });
    }

    setNewCourseName('');
    setIsAddingCourse(false);
  };

  const handleDeleteCourse = async (courseId: string) => {
    const prev = courses;
    const updated = courses.filter((c) => c.id !== courseId);
    setCourses(updated);
    dispatchCoursesUpdated(updated);

    // Always write to localStorage so task/meeting modals stay in sync
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(COURSE_STORAGE_KEY, JSON.stringify(updated));
    }

    if (userId) {
      await supabaseClient.from('courses').delete().eq('id', courseId).eq('user_id', userId);
      // No rollback — localStorage is already updated as the source of truth
    }
  };

  return (
    <>
      <div className="rounded-3xl border border-outline-variant bg-white p-8 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-on-surface">Courses & Projects</h2>
            <p className="mt-2 text-on-surface-variant">Organize your work into courses, projects, and groups.</p>
          </div>
          <button
            onClick={() => setIsAddingCourse(true)}
            className="rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            Add course
          </button>
        </div>
        {courses.length === 0 && (
          <p className="mt-8 text-sm italic text-outline">No courses yet. Add one to get started.</p>
        )}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {courses.map((course) => {
            const courseTasks = tasks.filter((t) => t.category === course.name);
            return (
              <div key={course.id} className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
                <div className="flex items-start justify-between">
                  <span className={`rounded-full px-3 py-1 text-sm font-semibold ${course.color}`}>
                    {course.name}
                  </span>
                  <button
                    onClick={() => handleDeleteCourse(course.id)}
                    className="rounded-full bg-blush-50 px-3 py-1 text-xs font-semibold text-blush-700 transition hover:bg-blush-100"
                  >
                    Delete
                  </button>
                </div>
                {course.description ? (
                  <p className="mt-4 text-sm text-on-surface-variant">{course.description}</p>
                ) : null}
                {courseTasks.length > 0 ? (
                  <div className="mt-5 space-y-3 border-t border-outline-variant pt-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-outline">
                      Tasks ({courseTasks.length})
                    </p>
                    {courseTasks.map((task) => (
                      <div key={task.id} className="rounded-xl border border-outline-variant bg-white p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h4 className="text-sm font-medium text-on-surface">{task.name}</h4>
                            <p className="mt-0.5 text-xs text-outline">{task.dueDate}</p>
                          </div>
                          <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${statusStyles[task.status]}`}>
                            {task.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-5 text-sm italic text-outline">No tasks yet for this course.</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add course modal */}
      {isAddingCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/20 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[32px] border border-outline-variant bg-white p-8 shadow-soft">
            <h2 className="text-2xl font-semibold text-on-surface">New Project</h2>
            <p className="mt-2 text-on-surface-variant">Enter a name for your course or project.</p>
            <form onSubmit={handleAddCourse} className="mt-6 space-y-4">
              <input
                autoFocus
                type="text"
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                placeholder="e.g. Product Design, CS 101…"
                className="w-full rounded-2xl border border-outline-variant bg-surface-container-low px-5 py-3 text-on-surface placeholder-outline focus:border-brand-500 focus:bg-white focus:outline-none"
              />
              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsAddingCourse(false); setNewCourseName(''); }}
                  className="flex-1 rounded-2xl border border-outline-variant px-6 py-3 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-2xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
