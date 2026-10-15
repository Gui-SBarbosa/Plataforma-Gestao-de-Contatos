export type ContactSource = "SITE" | "REFERRAL" | "SOCIAL" | "PHONE" | "OTHER";
export type Contact = { city: string | null; company: string | null; createdAt: string; email: string; id: string; name: string; phone: string; source: ContactSource };
export type ContactInput = Omit<Contact, "city" | "company" | "createdAt" | "id"> & { city?: string; company?: string };
export type ContactsPageData = { data: Contact[]; meta: { page: number; pageSize: number; total: number; totalPages: number } };
