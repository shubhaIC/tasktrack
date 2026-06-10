'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabaseClient } from '../../src/lib/supabase/client';

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TASK_STORAGE_KEY = 'tasktrack-tasks';
const MEETING_STORAGE_KEY = 'tasktrack-meetings';

type CalendarEvent = {
  id: string;
  title: string;
  date: Date;
  label: string;
  color: string;
};

// Handles both Supabase (snake_case) and localStorage (camelCase) shapes
type RawTask = { id: string; name: string; category: string; due_date?: string; dueDate?: string };
type RawMeeting = { id: string; title: string; category: string; date: string };

function getMonthGrid(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = firstDay.getDay();
  const totalDays = lastDay.getDate();
  const cells = Array.from({ length: startOffset + totalDays }, (_, i) => {
    const day = i - startOffset + 1;
    return day > 0 ? new Date(year, month, day) : null;
  });
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// Show time if the event has a non-midnight time component
function formatEventDateTime(date: Date): string {
  if (date.getHours() === 0 && date.getMinutes() === 0) {
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }
  return date.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function buildEvents(tasks: RawTask[], meetings: RawMeeting[]): CalendarEvent[] {
  const taskEvents: CalendarEvent[] = tasks.flatMap((t) => {
    const str = t.due_date ?? t.dueDate ?? '';
    if (!str) return [];
    const date = new Date(str);
    if (isNaN(date.getTime())) return [];
    return [{ id: `t::${t.id}`, title: t.name, date, label: `Task · ${t.category}`, color: 'bg-warning-100 text-warning-900' }];
  });

  const meetingEvents: CalendarEvent[] = meetings.flatMap((m) => {
    if (!m.date) return [];
    const date = new Date(m.date);
    if (isNaN(date.getTime())) return [];
    return [{ id: `m::${m.id}`, title: m.title, date, label: `Meeting · ${m.category}`, color: 'bg-brand-100 text-brand-800' }];
  });

  return [...taskEvents, ...meetingEvents];
}

export function MonthCalendar() {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [rawTasks, setRawTasks] = useState<RawTask[]>([]);
  const [rawMeetings, setRawMeetings] = useState<RawMeeting[]>([]);

  const events = useMemo(() => buildEvents(rawTasks, rawMeetings), [rawTasks, rawMeetings]);
  const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const grid = useMemo(() => getMonthGrid(currentDate.getFullYear(), currentDate.getMonth()), [currentDate]);

  const eventMap = useMemo(
    () =>
      events.reduce<Record<string, CalendarEvent[]>>((map, ev) => {
        const key = ev.date.toDateString();
        if (!map[key]) map[key] = [];
        map[key].push(ev);
        return map;
      }, {}),
    [events]
  );

  // Sidebar shows all events sorted by date, or only the selected day's events
  const sidebarEvents = useMemo(() => {
    if (selectedDate) {
      return events
        .filter((ev) => ev.date.toDateString() === selectedDate.toDateString())
        .sort((a, b) => a.date.getTime() - b.date.getTime());
    }
    return events.slice().sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [events, selectedDate]);

  const loadFromSupabase = async (uid: string) => {
    const [tasksRes, meetingsRes] = await Promise.all([
      supabaseClient.from('tasks').select('id, name, category, due_date').eq('user_id', uid),
      supabaseClient.from('meetings').select('id, title, category, date').eq('user_id', uid),
    ]);
    if (tasksRes.error || meetingsRes.error) {
      loadFromLocalStorage();
      return;
    }
    setRawTasks(tasksRes.data ?? []);
    setRawMeetings(meetingsRes.data ?? []);
  };

  const loadFromLocalStorage = () => {
    if (typeof window === 'undefined') return;
    try {
      const rt = window.localStorage.getItem(TASK_STORAGE_KEY);
      const rm = window.localStorage.getItem(MEETING_STORAGE_KEY);
      setRawTasks(rt ? (JSON.parse(rt) as RawTask[]) : []);
      setRawMeetings(rm ? (JSON.parse(rm) as RawMeeting[]) : []);
    } catch {}
  };

  useEffect(() => {
    let cancelled = false;

    supabaseClient.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      if (data.user) {
        loadFromSupabase(data.user.id);
      } else {
        loadFromLocalStorage();
      }
    });

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      if (session?.user) {
        loadFromSupabase(session.user.id);
      } else {
        loadFromLocalStorage();
      }
    });

    const handleTasksUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (Array.isArray(detail)) setRawTasks(detail as RawTask[]);
    };
    const handleMeetingsUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (Array.isArray(detail)) setRawMeetings(detail as RawMeeting[]);
    };

    window.addEventListener('tasktrack-tasks-updated', handleTasksUpdate);
    window.addEventListener('tasktrack-meetings-updated', handleMeetingsUpdate);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.removeEventListener('tasktrack-tasks-updated', handleTasksUpdate);
      window.removeEventListener('tasktrack-meetings-updated', handleMeetingsUpdate);
    };
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate((prev) =>
      prev?.toDateString() === date.toDateString() ? null : date
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[32px] border border-outline-variant bg-white p-6 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-500">Calendar</p>
          <h2 className="mt-3 text-3xl font-semibold text-on-surface">Month view</h2>
          <p className="mt-2 text-sm leading-6 text-on-surface-variant">Click a day to filter events. Click again to deselect.</p>
        </div>
        <div className="inline-flex items-center gap-3 rounded-3xl border border-outline-variant bg-surface-container-low px-4 py-2 text-sm font-semibold text-on-surface">
          <button
            onClick={handlePrevMonth}
            className="rounded-full bg-white px-3 py-2 transition hover:bg-surface-container"
          >
            Prev
          </button>
          <span>{monthLabel}</span>
          <button
            onClick={handleNextMonth}
            className="rounded-full bg-white px-3 py-2 transition hover:bg-surface-container"
          >
            Next
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-[32px] border border-outline-variant bg-white p-5 shadow-soft">
          <div className="grid grid-cols-7 gap-2 border-b border-outline-variant pb-4 text-center text-xs font-semibold uppercase tracking-[0.15em] text-outline">
            {days.map((day) => <div key={day}>{day}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-2 pt-4">
            {grid.map((date, index) => {
              const key = date?.toDateString() ?? `empty-${index}`;
              const dayEvents = date ? eventMap[date.toDateString()] : undefined;
              const isCurrentMonth = date && date.getMonth() === currentDate.getMonth();
              const isToday = date?.toDateString() === today.toDateString();
              const isSelected = date && selectedDate?.toDateString() === date.toDateString();
              return (
                <div
                  key={key}
                  onClick={() => { if (date && isCurrentMonth) handleDayClick(date); }}
                  className={`min-h-[115px] rounded-2xl border p-3 text-sm transition ${
                    !date
                      ? 'border-transparent bg-transparent'
                      : isSelected
                      ? 'cursor-pointer border-brand-500 bg-brand-50 ring-2 ring-brand-300'
                      : isCurrentMonth
                      ? isToday
                        ? 'cursor-pointer border-brand-300 bg-brand-50 hover:border-brand-400'
                        : 'cursor-pointer border-outline-variant bg-white hover:border-brand-300 hover:bg-brand-50/30'
                      : 'border-outline-variant/50 bg-surface-container-low text-outline'
                  }`}
                >
                  {date && (
                    <div className="flex items-start justify-between">
                      <span className={`text-sm font-semibold ${isSelected ? 'text-brand-700' : isToday ? 'text-brand-600' : 'text-on-surface'}`}>
                        {date.getDate()}
                      </span>
                      {isSelected ? (
                        <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-semibold text-white">Selected</span>
                      ) : isToday ? (
                        <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-semibold text-brand-700">Today</span>
                      ) : null}
                    </div>
                  )}
                  <div className="mt-2 space-y-1">
                    {dayEvents?.slice(0, 2).map((ev) => (
                      <div key={ev.id} className={`overflow-hidden rounded-xl px-2 py-1 text-xs font-semibold ${ev.color}`}>
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents && dayEvents.length > 2 && (
                      <div className="rounded-xl bg-surface-container px-2 py-1 text-xs text-outline">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside className="rounded-[32px] border border-outline-variant bg-white p-6 shadow-soft">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xl font-semibold text-on-surface">
              {selectedDate
                ? selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : 'Event details'}
            </h3>
            {selectedDate && (
              <button
                onClick={() => setSelectedDate(null)}
                className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-semibold text-on-surface-variant transition hover:bg-outline-variant"
              >
                All
              </button>
            )}
          </div>
          <div className="mt-5 space-y-3">
            {sidebarEvents.length === 0 && (
              <p className="text-sm italic text-outline">
                {selectedDate ? 'No events on this day.' : 'No events yet.'}
              </p>
            )}
            {sidebarEvents.map((ev) => (
              <div key={ev.id} className="rounded-2xl border border-outline-variant bg-surface-container-low p-4">
                <p className="text-sm font-semibold text-on-surface">{ev.title}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.15em] text-outline">{ev.label}</p>
                <p className="mt-1.5 text-sm text-on-surface-variant">{formatEventDateTime(ev.date)}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
