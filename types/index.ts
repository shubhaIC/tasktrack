export interface Course {
  id: string;
  user_id: string;
  name: string;
  description: string;
  color: string;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  course_id: string | null;
  title: string;
  description: string;
  due_date: string;
  status: 'Open' | 'In progress' | 'Completed';
  created_at: string;
  updated_at: string;
}

export interface Meeting {
  id: string;
  user_id: string;
  course_id: string | null;
  title: string;
  description: string;
  meeting_date: string;
  location: string;
  created_at: string;
}
