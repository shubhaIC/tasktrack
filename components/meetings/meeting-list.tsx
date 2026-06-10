'use client';

import { useEffect, useState } from 'react';
import { CreateModal, type TaskFormData } from '../ui/create-modal';
import { supabaseClient } from '../../src/lib/supabase/client';

type Meeting = {
  id: string;
  title: string;
  category: string;
  date: string;
  endDate: string;
  location: string;
  description: string;
};

const guestMeetings: Meeting[] = [
  { id: 'meeting-1', title: 'Project kickoff', category: 'Product Design', date: 'Apr 10, 2026', endDate: '', location: 'Room 204', description: 'Align on goals and deliverables.' },
  { id: 'meeting-2', title: 'Client sync', category: 'Business Analytics', date: 'Apr 12, 2026', endDate: '', location: 'Zoom', description: 'Review progress and next steps.' },
  { id: 'meeting-3', title: 'Weekly review', category: 'Team Ops', date: 'Apr 14, 2026', endDate: '', location: 'Teams', description: 'Recap accomplishments and blockers.' }
];

const MEETING_STORAGE_KEY = 'tasktrack-meetings';
const DEMO_MEETING_IDS = new Set(['meeting-1', 'meeting-2', 'meeting-3']);

function persist(meetings: Meeting[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(MEETING_STORAGE_KEY, JSON.stringify(meetings));
  try {
    window.dispatchEvent(new CustomEvent('tasktrack-meetings-updated', { detail: meetings }));
  } catch {
    const ev: any = document.createEvent('CustomEvent');
    ev.initCustomEvent('tasktrack-meetings-updated', false, false, meetings);
    window.dispatchEvent(ev);
  }
}

export function MeetingList() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Always write to localStorage so navigation never loses data.
  const applyMeetings = (list: Meeting[]) => {
    setMeetings(list);
    persist(list);
  };

  const loadFromSupabase = async (uid: string) => {
    const { data, error } = await supabaseClient
      .from('meetings')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: true });
    if (!error && data) {
      const mapped: Meeting[] = data.map((row: any) => ({
        id: row.id,
        title: row.title,
        category: row.category,
        date: row.date,
        endDate: row.end_date ?? '',
        location: row.location,
        description: row.description,
      }));
      applyMeetings(mapped);
    } else {
      // Supabase unavailable — use localStorage cache, but never show demo data to real users
      if (typeof window !== 'undefined') {
        try {
          const raw = window.localStorage.getItem(MEETING_STORAGE_KEY);
          const stored: Meeting[] = raw ? JSON.parse(raw) : [];
          const real = stored.filter((m) => !DEMO_MEETING_IDS.has(m.id));
          applyMeetings(real);
          return;
        } catch {}
      }
      applyMeetings([]);
    }
  };

  const loadFromLocalStorage = () => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(MEETING_STORAGE_KEY);
    let toUse = guestMeetings;
    if (raw) {
      try {
        const stored = JSON.parse(raw) as Meeting[];
        if (stored.length > 0) toUse = stored;
      } catch {}
    }
    applyMeetings(toUse);
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

  const handleCreateMeeting = async (formData: TaskFormData) => {
    const startDateTime = formData.date && formData.time ? `${formData.date} ${formData.time}` : formData.date;
    const parsedStart = new Date(startDateTime);
    const fmt = (d: Date) => d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const newMeeting: Meeting = {
      id: `meeting-${Date.now()}`,
      title: formData.title.trim(),
      category: formData.category,
      date: fmt(parsedStart),
      endDate: '',
      location: formData.location.trim() || 'TBD',
      description: formData.description || 'No description provided.',
    };

    const updated = [...meetings, newMeeting];
    applyMeetings(updated);

    if (userId) {
      await supabaseClient.from('meetings').insert({
        id: newMeeting.id,
        user_id: userId,
        title: newMeeting.title,
        category: newMeeting.category,
        date: newMeeting.date,
        end_date: newMeeting.endDate,
        location: newMeeting.location,
        description: newMeeting.description,
      });
    }

    setIsModalOpen(false);
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    const updated = meetings.filter((m) => m.id !== meetingId);
    applyMeetings(updated); // localStorage is already updated — never roll back on Supabase errors

    if (userId) {
      await supabaseClient.from('meetings').delete().eq('id', meetingId).eq('user_id', userId);
    }
  };

  // Hide meetings whose end time (or start time if no end time) has already passed.
  // They stay in localStorage so the calendar can still display them.
  const activeMeetings = meetings.filter((m) => {
    const refStr = m.endDate || m.date;
    const refTime = new Date(refStr);
    return isNaN(refTime.getTime()) || refTime > new Date();
  });

  return (
    <>
      <div className="rounded-3xl border border-outline-variant bg-white p-8 shadow-soft">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-on-surface">Meeting schedule</h2>
            <p className="mt-2 text-on-surface-variant">Plan upcoming meetings and review your agenda.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            Create meeting
          </button>
        </div>
        <div className="mt-8 space-y-4">
          {activeMeetings.length === 0 && (
            <p className="text-sm italic text-outline">No upcoming meetings.</p>
          )}
          {activeMeetings.map((meeting) => (
            <div key={meeting.id} className="rounded-2xl border border-outline-variant bg-surface-container-low p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-on-surface">{meeting.title}</h3>
                    <span className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-on-surface-variant">
                      {meeting.category}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-on-surface-variant">{meeting.description}</p>
                  <p className="mt-1 text-sm text-outline">{meeting.location}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-sage-50 px-3 py-1 text-sm font-semibold text-sage-600">
                    {meeting.date}
                  </span>
                  <button
                    onClick={() => handleDeleteMeeting(meeting.id)}
                    className="rounded-full bg-blush-50 px-3 py-1 text-sm font-semibold text-blush-700 transition hover:bg-blush-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <CreateModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleCreateMeeting} type="event" />
    </>
  );
}
