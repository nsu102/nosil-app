import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// TODO: 추후 로그인 로직으로 변경 — 현재는 랜덤 uid를 생성하여 사용
const UID_KEY = 'nosil:uid';

function generateUid(): string {
  const s = () => Math.random().toString(36).substring(2, 10);
  return `${s()}${s()}${s()}${s()}`;
}

let cachedUid: string | null = null;

export function useUserId() {
  const [uid, setUid] = useState<string | null>(cachedUid);

  useEffect(() => {
    if (cachedUid) return;
    (async () => {
      let stored = await AsyncStorage.getItem(UID_KEY);
      if (!stored) {
        stored = generateUid();
        await AsyncStorage.setItem(UID_KEY, stored);
      }
      cachedUid = stored;
      setUid(stored);
    })();
  }, []);

  return uid;
}
