export function validateTaskPayload(payload: { title: string; dueDate?: string; status?: string }) {
  const errors = [] as string[];
  if (!payload.title?.trim()) {
    errors.push('Title is required.');
  }
  if (payload.dueDate && Number.isNaN(Date.parse(payload.dueDate))) {
    errors.push('Due date must be a valid date.');
  }
  return errors;
}
