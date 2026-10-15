import { useCallback, useEffect, useState } from "react";

import { createContact, listContacts } from "./contacts.api";
import type { Contact, ContactInput } from "./contacts.types";

export const useContacts = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (targetPage = page) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await listContacts(targetPage);
      setContacts(response.data);
      setMeta(response.meta);
      setPage(response.meta.page);
    } catch {
      setError("Não foi possível carregar os contatos.");
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => { void refresh(1); }, [refresh]);

  const addContact = async (input: ContactInput) => {
    const contact = await createContact(input);
    await refresh(1);
    return contact;
  };

  return { addContact, contacts, error, isLoading, meta, refresh, setPage };
};
