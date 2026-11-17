import type { NotificationCodeMaster, ReminderCodeMaster } from '@/types';

const code = (id: string, appId: string, value: string, name: string, category: string, description: string): NotificationCodeMaster => ({
  id, appId, code: value, name, category, description, status: 'active',
});

export function seedNotificationCodeMasters(): NotificationCodeMaster[] {
  return [
    code('ncm-keka-welcome', 'app-keka', 'KEKA_NEW_HIRE_WELCOME', 'New Hire Welcome', 'Onboarding', 'Welcome message for new employees.'),
    code('ncm-keka-documents', 'app-keka', 'KEKA_DOCUMENT_PENDING', 'Document Pending', 'Employee Documents', 'Reminder when employee documents need attention.'),
    code('ncm-crm-lead', 'app-dealpulse', 'CRM_NEW_LEAD_ASSIGNED', 'New Lead Assigned', 'Lead Management', 'Notifies a salesperson about a newly assigned lead.'),
    code('ncm-crm-stage', 'app-dealpulse', 'CRM_LEAD_STAGE_UPDATED', 'Lead Stage Updated', 'Lead Management', 'Notifies teams when a lead changes stage.'),
    code('ncm-skillup-deadline', 'app-skillup', 'SKILLUP_COURSE_DEADLINE', 'Course Deadline', 'Learning', 'Course deadline notification.'),
    code('ncm-finance-payment', 'app-finance', 'FINANCE_PAYMENT_SUCCESS', 'Payment Successful', 'Payments', 'Payment completion notification.'),
    code('ncm-finance-approval', 'app-finance', 'FINANCE_APPROVAL_PENDING', 'Approval Pending', 'Approvals', 'Approval action required notification.'),
  ];
}

export function seedReminderCodeMasters(): ReminderCodeMaster[] {
  return [
    { id: 'rcm-keka-documents', appId: 'app-keka', code: 'KEKA_DOCUMENT_PENDING', name: 'Document Submission Reminder', category: 'Employee Documents', description: 'Reminds employees about incomplete documents.', reasons: ['Required document not submitted.', 'Document verification pending.', 'Employee document information incomplete.'], status: 'active' },
    { id: 'rcm-crm-followup', appId: 'app-dealpulse', code: 'CRM_FOLLOWUP_DUE', name: 'Lead Follow-up Reminder', category: 'Lead Management', description: 'Reminds owners about scheduled lead follow-ups.', reasons: ['Scheduled lead follow-up approaching.', 'Lead follow-up overdue.', 'Customer response pending.'], status: 'active' },
    { id: 'rcm-skillup-deadline', appId: 'app-skillup', code: 'SKILLUP_COURSE_DEADLINE', name: 'Course Deadline Reminder', category: 'Learning', description: 'Reminds learners about course deadlines.', reasons: ['Course deadline approaching.', 'Course completion pending.', 'Mandatory training overdue.'], status: 'active' },
    { id: 'rcm-finance-approval', appId: 'app-finance', code: 'FINANCE_APPROVAL_PENDING', name: 'Approval Pending Reminder', category: 'Approvals', description: 'Reminds approvers about pending finance actions.', reasons: ['Transaction approval pending.', 'Approval deadline approaching.', 'Required approval action incomplete.'], status: 'active' },
  ];
}
