import { supabase } from './supabase';

export type AdminActivityAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'published'
  | 'unpublished'
  | 'reordered'
  | 'imported'
  | 'progress updated';

export interface AdminActivity {
  id: string;
  action: AdminActivityAction;
  entity_type: string;
  entity_title: string;
  created_at: string;
}

export async function logAdminActivity(
  action: AdminActivityAction,
  entityType: string,
  entityTitle: string
): Promise<void> {
  const { error } = await supabase.from('admin_activity_logs').insert({
    action,
    entity_type: entityType,
    entity_title: entityTitle,
  });

  if (error) {
    console.error('Failed to record admin activity:', error.message);
  }
}
