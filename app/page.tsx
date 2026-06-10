import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-surface">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 rounded-[32px] border border-outline-variant bg-white p-8 shadow-soft lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-brand-500">TaskTrack</p>
            <h1 className="max-w-2xl text-5xl font-semibold tracking-tight text-on-surface sm:text-6xl">
              A focused workspace for tasks, courses, and meetings.
            </h1>
            <p className="max-w-xl text-lg leading-8 text-on-surface-variant">
              Stay organized with a clean dashboard, project organization, and calendar view optimized for students and professionals.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
              >
                View dashboard
              </Link>
              <Link
                href="/calendar"
                className="inline-flex items-center justify-center rounded-full border border-outline-variant bg-surface-container-low px-6 py-3 text-sm font-semibold text-on-surface transition hover:bg-surface-container"
              >
                Explore calendar
              </Link>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link href="/dashboard" className="rounded-3xl border border-outline-variant bg-surface-container-low p-6 text-sm font-semibold text-on-surface transition hover:border-brand-300 hover:bg-white">
              Manage Tasks
            </Link>
            <Link href="/dashboard" className="rounded-3xl border border-outline-variant bg-surface-container-low p-6 text-sm font-semibold text-on-surface transition hover:border-brand-300 hover:bg-white">
              Schedule Meetings
            </Link>
            <Link href="/dashboard" className="rounded-3xl border border-outline-variant bg-surface-container-low p-6 text-sm font-semibold text-on-surface transition hover:border-brand-300 hover:bg-white">
              Organize Courses
            </Link>
            <Link href="/calendar" className="rounded-3xl border border-outline-variant bg-surface-container-low p-6 text-sm font-semibold text-on-surface transition hover:border-brand-300 hover:bg-white">
              View Calendar
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
