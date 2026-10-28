// Shared by the leads API and the admin Leads screen
export const LEAD_STATUSES = ["New", "Contacted", "Qualified", "Closed", "Spam"];

// Closed and spam leads never show as "follow-up due"
export const OPEN_LEAD_STATUSES = ["New", "Contacted", "Qualified"];
