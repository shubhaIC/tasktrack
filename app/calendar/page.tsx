import { MonthCalendar } from '../../components/calendar/month-calendar';

export default function CalendarPage() {
  return (
    <main className="min-h-screen bg-surface px-6 py-10">
      <div className="mx-auto max-w-7xl px-2 sm:px-0">
        <MonthCalendar />
      </div>
    </main>
  );
}
