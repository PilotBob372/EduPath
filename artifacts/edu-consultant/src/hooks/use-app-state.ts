import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        setStoredValue(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue] as const;
}

export function useAppState() {
  const [profileId, setProfileId] = useLocalStorage<number | null>('edupath_profileId', null);
  const [selectedUniversityId, setSelectedUniversityId] = useLocalStorage<number | null>('edupath_univId', null);
  const [selectedSpecialty, setSelectedSpecialty] = useLocalStorage<string | null>('edupath_specialty', null);
  const [conversationId, setConversationId] = useLocalStorage<number | null>('edupath_conversationId', null);

  return {
    profileId, setProfileId,
    selectedUniversityId, setSelectedUniversityId,
    selectedSpecialty, setSelectedSpecialty,
    conversationId, setConversationId
  };
}
