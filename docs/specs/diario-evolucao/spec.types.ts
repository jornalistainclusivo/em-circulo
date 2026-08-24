export interface WeeklyReport {
  id: string;
  care_recipient_id: string;
  author_id: string;
  report_date: string;
  summary_text?: string;
  mood?: string;
  diet?: string;
  wellbeing_notes?: string;
  pdf_url?: string | null;
  created_at: string;
}

export interface WeeklyReportCreate {
  report_date: string;
  summary_text?: string;
  mood?: string;
  diet?: string;
  wellbeing_notes?: string;
}
