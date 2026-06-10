'use client';

import { useEffect, useState } from 'react';
import { supabaseClient } from '../../src/lib/supabase/client';

const TASK_STORAGE_KEY = 'tasktrack-tasks';
const MEETING_STORAGE_KEY = 'tasktrack-meetings';

type Task = {
  id: string;
  name: string;
  category: string;
  dueDate: string;
  status: string;
};

type Meeting = {
  id: string;
  title: string;
  category: string;
  date: string;
  endDate?: string;
  description: string;
};

function isActiveMeeting(m: Meeting): boolean {
  const refStr = m.endDate || m.date;
  const refTime = new Date(refStr);
  return isNaN(refTime.getTime()) || refTime > new Date();
}

function readUpcomingTasks(): Task[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(TASK_STORAGE_KEY);
  if (!raw) return [];
  try {
    return (JSON.parse(raw) as Task[])
      .filter((t) => t.status !== 'Completed')
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 3);
  } catch {
    return [];
  }
}

function readUpcomingMeetings(): Meeting[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(MEETING_STORAGE_KEY);
  if (!raw) return [];
  try {
    return (JSON.parse(raw) as Meeting[]).filter(isActiveMeeting).slice(0, 3);
  } catch {
    return [];
  }
}

export function UpcomingTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  const loadFromSupabase = async (uid: string) => {
    const [tasksRes, meetingsRes] = await Promise.all([
      supabaseClient
        .from('tasks')
        .select('id, name, category, due_date, status')
        .eq('user_id', uid)
        .neq('status', 'Completed')
        .order('created_at', { ascending: true })
        .limit(3),
      supabaseClient
        .from('meetings')
        .select('id, title, category, date, description')
        .eq('user_id', uid)
        .order('created_at', { ascending: true })
        .limit(3),
    ]);

    if (!tasksRes.error && tasksRes.data) {
      setTasks(
        tasksRes.data.map((row: any) => ({
          id: row.id,
          name: row.name,
          category: row.category,
          dueDate: row.due_date,
          status: row.status,
        }))
      );
    } else {
      // Supabase unavailable — show from localStorage cache
      setTasks(readUpcomingTasks());
    }

    if (!meetingsRes.error && meetingsRes.data) {
      setMeetings(
        meetingsRes.data.map((row: any) => ({
          id: row.id,
          title: row.title,
          category: row.category,
          date: row.date,
          endDate: row.end_date ?? '',
          description: row.description,
        })).filter(isActiveMeeting)
      );
    } else {
      setMeetings(readUpcomingMeetings());
    }
  };

  useEffect(() => {
    let cancelled = false;

    supabaseClient.auth.getUser().then(({ data }: any) => {
      if (cancelled) return;
      if (data.user) {
        loadFromSupabase(data.user.id);
      } else {
        setTasks(readUpcomingTasks());
        setMeetings(readUpcomingMeetings());
      }
    });

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event: any, session: any) => {
      if (cancelled) return;
      if (session?.user) {
        loadFromSupabase(session.user.id);
      } else {
        setTasks(readUpcomingTasks());
        setMeetings(readUpcomingMeetings());
      }
    });

    // Real-time updates when TaskList/MeetingList mutate data on the same page
    const handleTasksUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (Array.isArray(detail)) {
        setTasks(
          (detail as Task[])
            .filter((t) => t.status !== 'Completed')
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
            .slice(0, 3)
        );
      } else {
        setTasks(readUpcomingTasks());
      }
    };

    const handleMeetingsUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (Array.isArray(detail)) {
        setMeetings((detail as Meeting[]).filter(isActiveMeeting).slice(0, 3));
      } else {
        setMeetings(readUpcomingMeetings());
      }
    };

    window.addEventListener('tasktrack-tasks-updated', handleTasksUpdate);
    window.addEventListener('tasktrack-meetings-updated', handleMeetingsUpdate);
    window.addEventListener('storage', () => {
      setTasks(readUpcomingTasks());
      setMeetings(readUpcomingMeetings());
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.removeEventListener('tasktrack-tasks-updated', handleTasksUpdate);
      window.removeEventListener('tasktrack-meetings-updated', handleMeetingsUpdate);
    };
  }, []);

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-3xl border border-outline-variant bg-white p-8 shadow-soft">
        <h2 className="text-2xl font-semibold text-on-surface">Upcoming tasks</h2>
        <p className="mt-2 text-on-surface-variant">Stay on top of your most important deadlines.</p>
        <div className="mt-6 space-y-4">
          {tasks.length === 0 && (
            <p className="text-sm italic text-outline">No upcoming tasks yet.</p>
          )}
          {tasks.map((task) => (
            <div key={task.id} className="rounded-2xl border border-outline-variant bg-surface-container-low p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-on-surface">{task.name}</h3>
                  <p className="mt-1 text-sm text-on-surface-variant">{task.category}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  task.status === 'In Progress' ? 'bg-brand-100 text-brand-700' : 'bg-sage-50 text-sage-600'
                }`}>
                  {task.status}
                </span>
              </div>
              <p className="mt-3 text-sm text-outline">Due {task.dueDate}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-outline-variant bg-white p-8 shadow-soft">
        <h2 className="text-2xl font-semibold text-on-surface">Upcoming meetings</h2>
        <p className="mt-2 text-on-surface-variant">Your next scheduled events.</p>
        <div className="mt-6 space-y-4">
          {meetings.length === 0 && (
            <p className="text-sm italic text-outline">No upcoming meetings yet.</p>
          )}
          {meetings.map((meeting) => (
            <div key={meeting.id} className="rounded-2xl border border-outline-variant bg-surface-container-low p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-on-surface">{meeting.title}</h3>
                  <p className="mt-1 text-sm text-on-surface-variant">{meeting.category}</p>
                </div>
                <span className="rounded-full bg-sage-50 px-3 py-1 text-xs font-semibold text-sage-600">
                  {meeting.date}
                </span>
              </div>
              <p className="mt-3 text-sm text-outline">{meeting.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
