
import { supabase } from '../lib/supabase';

export interface ReadingProgress {
  user_id: string;
  lesson_id: string;
  last_opened_at: string;
  scroll_position: number;
}

// Store the most recently opened lesson for the signed-in user.
export async function saveLastOpenedLesson(lessonId: string): Promise<void> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('You must be signed in to save reading progress.');
  }

  const { error } = await supabase
    .from('knowledge_reading_progress')
    .upsert({
      user_id: user.id,
      lesson_id: lessonId,
      last_opened_at: new Date().toISOString(),
      scroll_position: 0,
    }, { onConflict: 'user_id' });

  if (error) throw error;
}

// Retrieve the last-opened lesson for the signed-in user.
export async function getLastOpenedLesson(): Promise<ReadingProgress | null> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) return null;

  const { data, error } = await supabase
    .from('knowledge_reading_progress')
    .select('user_id, lesson_id, last_opened_at, scroll_position')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) throw error;

  return data as ReadingProgress | null;
}


export interface ResumeReadingLocation {
  lessonId: string;
  moduleId: string;
  courseId: string;
  lessonTitle: string;
}

// Find the course and module that contain the last-opened lesson.
export async function getResumeReadingLocation(): Promise<ResumeReadingLocation | null> {
  const readingProgress = await getLastOpenedLesson();
  if (!readingProgress) return null;

  const { data: lesson, error: lessonError } = await supabase
    .from('knowledge_lessons')
    .select('id, module_id, title')
    .eq('id', readingProgress.lesson_id)
    .maybeSingle();

  if (lessonError) throw lessonError;
  if (!lesson) return null;

  const { data: module, error: moduleError } = await supabase
    .from('knowledge_modules')
    .select('id, course_id')
    .eq('id', lesson.module_id)
    .maybeSingle();

  if (moduleError) throw moduleError;
  if (!module) return null;

  return {
    lessonId: lesson.id,
    moduleId: module.id,
    courseId: module.course_id,
    lessonTitle: lesson.title,
  };
}
