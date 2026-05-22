import { useEffect, useState } from 'react';

const SEOUL_LAT = Number(process.env.EXPO_PUBLIC_WEATHER_LAT || '37.5665');
const SEOUL_LON = Number(process.env.EXPO_PUBLIC_WEATHER_LON || '126.9780');
const WEATHER_TZ = process.env.EXPO_PUBLIC_WEATHER_TIMEZONE || 'Asia/Seoul';

const MONTHLY_CLIMATE: Record<number, { temp: number; humidity: number; uv: number; pm25: number; note: string }> = {
  1: { temp: 2, humidity: 50, uv: 2, pm25: 28, note: '한겨울 — 차고 건조' },
  2: { temp: 4, humidity: 50, uv: 3, pm25: 32, note: '늦겨울 — 미세먼지 주의' },
  3: { temp: 9, humidity: 55, uv: 5, pm25: 38, note: '봄 환절기 — 황사철' },
  4: { temp: 14, humidity: 60, uv: 7, pm25: 35, note: '봄 — 자외선 급상승' },
  5: { temp: 19, humidity: 65, uv: 8, pm25: 25, note: '초여름 — 자외선 강함' },
  6: { temp: 23, humidity: 75, uv: 9, pm25: 18, note: '초여름 — 자외선 매우 강함' },
  7: { temp: 26, humidity: 82, uv: 9, pm25: 15, note: '장마 — 습하고 자외선 강함' },
  8: { temp: 27, humidity: 78, uv: 9, pm25: 16, note: '한여름 — 가장 더운 시기' },
  9: { temp: 22, humidity: 70, uv: 6, pm25: 18, note: '초가을 — 자외선 여전' },
  10: { temp: 16, humidity: 60, uv: 4, pm25: 22, note: '가을 — 쾌적' },
  11: { temp: 9, humidity: 55, uv: 3, pm25: 30, note: '늦가을 — 건조 시작' },
  12: { temp: 3, humidity: 50, uv: 2, pm25: 32, note: '초겨울 — 차고 건조' },
};

const dayVariation = (dateStr: string, range = 4): number => {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash + dateStr.charCodeAt(i)) | 0;
  }
  return ((Math.abs(hash) % (range * 100)) / 100) - range / 2;
};

export type WeatherData = {
  temp: number;
  humidity: number;
  uv: number;
  pm25: number;
  seasonNote: string;
  isEstimate: boolean;
};

const buildEstimate = (): WeatherData => {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const month = today.getMonth() + 1;
  const base = MONTHLY_CLIMATE[month];
  const tempVar = dayVariation(dateStr + 'temp', 6);
  const humidVar = dayVariation(dateStr + 'humid', 16);
  const pmVar = dayVariation(dateStr + 'pm', 24);
  const uvVar = dayVariation(dateStr + 'uv', 2);

  return {
    temp: Math.round((base.temp + tempVar) * 10) / 10,
    humidity: Math.max(20, Math.min(95, Math.round(base.humidity + humidVar))),
    uv: Math.max(0, Math.min(11, Math.round((base.uv + uvVar) * 10) / 10)),
    pm25: Math.max(5, Math.round(base.pm25 + pmVar)),
    seasonNote: base.note,
    isEstimate: true,
  };
};

const roundOne = (value: number) => Math.round(value * 10) / 10;

const formatObservedLabel = (weatherCode: number, observedAt?: string) => {
  const codeText = weatherCodeText(weatherCode);
  if (!observedAt) return codeText || '실시간 반영';
  const hhmm = observedAt.slice(11, 16);
  return codeText ? `${codeText} · ${hhmm} 기준` : `${hhmm} 기준`;
};

export const useWeatherToday = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const weatherUrl =
          `https://api.open-meteo.com/v1/forecast?latitude=${SEOUL_LAT}&longitude=${SEOUL_LON}` +
          `&current=temperature_2m,relative_humidity_2m,weather_code&timezone=${encodeURIComponent(WEATHER_TZ)}`;
        const airUrl =
          `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${SEOUL_LAT}&longitude=${SEOUL_LON}` +
          `&current=pm2_5,uv_index&timezone=${encodeURIComponent(WEATHER_TZ)}`;

        const [weatherRes, airRes] = await Promise.all([
          fetch(weatherUrl, { signal: controller.signal }),
          fetch(airUrl, { signal: controller.signal }),
        ]);

        if (!weatherRes.ok || !airRes.ok) {
          throw new Error('weather-fetch-failed');
        }

        const weatherJson = await weatherRes.json();
        const airJson = await airRes.json();
        const currentWeather = weatherJson?.current;
        const currentAir = airJson?.current;

        if (
          typeof currentWeather?.temperature_2m !== 'number' ||
          typeof currentWeather?.relative_humidity_2m !== 'number' ||
          typeof currentAir?.pm2_5 !== 'number' ||
          typeof currentAir?.uv_index !== 'number'
        ) {
          throw new Error('weather-shape-invalid');
        }

        setWeather({
          temp: roundOne(currentWeather.temperature_2m),
          humidity: Math.round(currentWeather.relative_humidity_2m),
          uv: roundOne(currentAir.uv_index),
          pm25: Math.round(currentAir.pm2_5),
          seasonNote: formatObservedLabel(currentWeather.weather_code, currentWeather.time || currentAir.time),
          isEstimate: false,
        });
      } catch (err) {
        if (controller.signal.aborted) return;
        setWeather(buildEstimate());
        setError(err instanceof Error ? err.message : 'weather-load-failed');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, []);

  return { weather, loading, error };
};

export type WeatherTask = {
  time: string;
  task: string;
  icon: string;
  condition: string;
};

export const buildWeatherTasks = (w: WeatherData | null): WeatherTask[] => {
  if (!w) return [];
  const tasks: WeatherTask[] = [];

  if (typeof w.uv === 'number') {
    if (w.uv >= 8) {
      tasks.push({ time: '12:00', task: '자외선 매우 강함 — 선크림 2시간마다 덧바르기', icon: '🌞', condition: 'uv-extreme' });
    } else if (w.uv >= 5) {
      tasks.push({ time: '12:00', task: '자외선 강함 — 선크림 꼼꼼히 다시 바르기', icon: '☀️', condition: 'uv-high' });
    } else if (w.uv >= 3) {
      tasks.push({ time: '12:00', task: '자외선 보통 — 외출 전 선크림 챙기기', icon: '☀️', condition: 'uv-mid' });
    }
  }

  if (typeof w.pm25 === 'number') {
    if (w.pm25 >= 75) {
      tasks.push({ time: '22:00', task: '미세먼지 매우나쁨 — 2차 세안 + 클렌징오일까지 꼼꼼히', icon: '😷', condition: 'pm-extreme' });
    } else if (w.pm25 >= 35) {
      tasks.push({ time: '22:00', task: '미세먼지 나쁨 — 2차 세안 꼼꼼히', icon: '😷', condition: 'pm-bad' });
    } else if (w.pm25 >= 16) {
      tasks.push({ time: '22:00', task: '미세먼지 보통 — 클렌징 평소처럼 꼼꼼히', icon: '😷', condition: 'pm-mid' });
    }
  }

  if (typeof w.humidity === 'number') {
    if (w.humidity < 30) {
      tasks.push({ time: '15:00', task: '건조함 심함 — 미스트 + 수분크림 보충', icon: '💧', condition: 'humidity-low' });
    } else if (w.humidity < 45) {
      tasks.push({ time: '22:00', task: '건조한 날 — 수분크림 듬뿍 바르기', icon: '💧', condition: 'humidity-mid' });
    } else if (w.humidity > 80) {
      tasks.push({ time: '09:00', task: '습한 날 — 산뜻한 젤 타입으로 가볍게', icon: '🌫️', condition: 'humidity-high' });
    }
  }

  if (typeof w.temp === 'number') {
    if (w.temp >= 28) {
      tasks.push({ time: '13:00', task: '더위 주의 — 쿨링 시트/아이싱으로 진정', icon: '🧊', condition: 'temp-hot' });
    } else if (w.temp <= 8) {
      tasks.push({ time: '09:00', task: '추위 주의 — 보습 강화 + 립밤 챙기기', icon: '🧣', condition: 'temp-cold' });
    }
  }

  return tasks;
};

export const weatherCodeText = (code: number): string => {
  if (code === 0) return '맑음';
  if (code === 1 || code === 2) return '대체로 맑음';
  if (code === 3) return '흐림';
  if (code >= 45 && code <= 48) return '안개';
  if (code >= 51 && code <= 57) return '이슬비';
  if (code >= 61 && code <= 67) return '비';
  if (code >= 71 && code <= 77) return '눈';
  if (code >= 80 && code <= 82) return '소나기';
  if (code >= 85 && code <= 86) return '눈소나기';
  if (code >= 95) return '뇌우';
  return '';
};
