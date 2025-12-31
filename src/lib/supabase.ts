import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Mostrar mensaje de configuración más claro
  console.error('🚨 CONFIGURACIÓN REQUERIDA: Faltan las variables de entorno de Supabase');
  console.error('📝 Pasos para configurar:');
  console.error('1. Copia .env.example como .env');
  console.error('2. Completa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY');
  console.error('3. Encuentra estos valores en: https://supabase.com/dashboard -> Settings -> API');
  throw new Error('❌ Faltan las variables de entorno de Supabase. Verifica el archivo .env y consulta la documentación.');
}

// Verificar que las URLs tengan el formato correcto
if (!supabaseUrl.includes('supabase.co') || !supabaseAnonKey.startsWith('eyJ')) {
  console.error('🔍 Verifica que las variables de entorno tengan el formato correcto');
  console.error('URL debe contener "supabase.co" y anon key debe empezar con "eyJ"');
  throw new Error('❌ Formato de variables de entorno inválido. Verifica .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos de base de datos
export interface Profile {
  id: string;
  full_name: string;
  role: 'admin' | 'user';
  email: string;
  is_affiliate?: boolean;
  created_at?: string;
}

export interface Delegate {
  id: string;
  full_name: string;
  role_type: 'comite' | 'sindical' | 'prevencion';
  bio: string;
  image_url?: string;
  photo_url?: string;
  display_order: number;
  position?: string;
  email?: string;
  phone?: string;
  description?: string;
  active?: boolean;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface AttachmentFile {
  url: string;
  fileName: string;
  fileSize: number;
  fileType: string;
}

export interface Communique {
  id: string;
  created_at: string;
  title: string;
  content: string;
  author_id?: string;
  category_id?: string;
  category?: Category;
  is_published: boolean;
  image_url?: string;
  attachments?: AttachmentFile[];
}

export interface Comment {
  id: string;
  created_at: string;
  content: string;
  post_id: string;
  user_id: string;
  author?: {
    full_name: string;
  };
}

export interface CommentReaction {
  id: string;
  comment_id: string;
  user_id: string;
  reaction_type: 'like' | 'dislike';
  created_at?: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  slot_id?: string;
  delegate_type: 'comite' | 'sindical' | 'prevencion';
  start_time: string;
  end_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  comments?: string;
  questions?: string;
  documents?: AttachmentFile[];
  created_at?: string;
  slot?: AppointmentSlot;
  user?: Profile;
}

export interface AppointmentSlot {
  id: string;
  delegate_type: 'comite' | 'sindical' | 'prevencion';
  start_time: string;
  end_time: string;
  appointment_date: string;
  status: 'available' | 'blocked' | 'occupied';
  blocked_by?: string;
  block_reason?: string;
  created_at?: string;
}

export interface Survey {
  id: string;
  question: string;
  options: Array<{ id: number; text: string }>;
  is_active: boolean;
  tipo?: 'publica' | 'afiliados';
  created_at?: string;
  fecha_fin?: string;
}

export interface SurveyResponse {
  id: string;
  survey_id: string;
  user_id: string;
  selected_option_id: number;
  created_at?: string;
}

export interface NegotiationStatus {
  id: string;
  topic: string;
  percentage: number;
  updated_at?: string;
}

export interface Suggestion {
  id: string;
  content: string;
  created_at?: string;
}

export interface CommentReply {
  id: string;
  comment_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  author?: {
    full_name: string;
  };
}

export interface Document {
  id: string;
  title: string;
  description?: string;
  file_url: string;
  category: string;
  file_size?: number;
  file_type?: string;
  uploaded_by: string;
  created_at: string;
  updated_at?: string;
  uploader?: {
    full_name: string;
  };
}


// Tipos para funcionalidades de afiliados
export interface SyndicalDocument {
  id: string;
  title: string;
  description?: string;
  category: string;
  file_url: string;
  file_type?: string;
  file_size_mb?: number;
  uploaded_by?: string;
  upload_date?: string;
  is_active: boolean;
  created_at?: string;
}

export interface InternalPoll {
  id: string;
  question: string;
  description?: string;
  options: string[];
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_by?: string;
  created_at?: string;
}

export interface PollVote {
  id: string;
  poll_id: string;
  user_id: string;
  selected_option: string;
  vote_date?: string;
}

export interface AffiliateBenefit {
  id: string;
  company_name: string;
  description: string;
  discount_code?: string;
  discount_percentage?: number;
  conditions?: string;
  partner_logo_url?: string;
  category?: string;
  is_active: boolean;
  created_at?: string;
}

// Tipos para sistema de notificaciones push automáticas
export interface NotificationPreference {
  id?: string;
  admin_id: string;
  event_type: string;
  enabled: boolean;
  title_template?: string;
  message_template?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AdminNotificationPreferences {
  id: string;
  user_id: string;
  push_enabled: boolean;
  email_enabled: boolean;
  notify_new_appointment: boolean;
  notify_appointment_modified: boolean;
  notify_appointment_cancelled: boolean;
  notify_appointment_status_change: boolean;
  created_at: string;
  updated_at: string;
}

export interface PushNotificationHistory {
  id: string;
  appointment_id?: string;
  event_type: string;
  title: string;
  message: string;
  recipients_count: number | null;
  status: string;
  error_message?: string;
  created_at: string;
}
