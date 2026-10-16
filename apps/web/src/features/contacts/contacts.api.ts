import { getCsrfToken, request } from "../../services/http";
import type { ContactInput, ContactsPageData } from "./contacts.types";

export const listContacts = (page: number) => request<ContactsPageData>(`/api/contacts?page=${page}&pageSize=10`);

export const createContact = async (input: ContactInput) => {
  const csrfToken = await getCsrfToken();
  const response = await request<{ data: { contact: ContactsPageData["data"][number] } }>("/api/contacts", {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
    method: "POST",
  });
  return response.data.contact;
};
