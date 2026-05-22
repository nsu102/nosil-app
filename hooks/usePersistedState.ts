import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PersistedStateOptions<T> {
  serialize?: (value: T) => string;
  deserialize?: (raw: string) => T;
}

export function usePersistedState<T>(
  key: string,
  defaultValue: T,
  options?: PersistedStateOptions<T>
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const serialize = options?.serialize || JSON.stringify;
  const deserialize = options?.deserialize || JSON.parse;
  const [value, setValue] = useState<T>(defaultValue);
  const loaded = useRef(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const result = await AsyncStorage.getItem(key);
        if (mounted && result !== null) {
          setValue(deserialize(result));
        }
      } catch (_) {}
      loaded.current = true;
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    (async () => {
      try {
        await AsyncStorage.setItem(key, serialize(value));
      } catch (_) {}
    })();
  }, [value]);

  return [value, setValue];
}
