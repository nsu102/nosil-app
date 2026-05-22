# 노실장 (NO실장) - 피부과 시술 가이드 앱

피부 시술 상담, 병원 검색, 시술 기록 관리, AI 상담을 제공하는 React Native(Expo) 앱입니다.

## 기술 스택

- **Expo** (React Native) + expo-router
- **Supabase** (PostgreSQL, Auth, Storage)
- **Claude API** (AI 피부 상담 + 사진 분석)

## 프로젝트 구조

```
nosil-app/
├── app/                    # 페이지 (expo-router)
│   ├── _layout.tsx         # 탭 네비게이션
│   ├── index.tsx           # 홈
│   ├── recommend.tsx       # AI 사진 분석 + 시술 추천
│   ├── encyclopedia.tsx    # 시술 백과
│   ├── hospitals.tsx       # 병원 찾기
│   ├── daily.tsx           # 데일리 케어 (날씨 기반)
│   ├── record.tsx          # 내 시술 기록
│   └── chat.tsx            # AI 상담 채팅
├── data/                   # 정적 데이터
├── utils/                  # 유틸 함수 (날짜, 스케줄, 날씨 등)
├── hooks/                  # 커스텀 훅
├── lib/                    # Claude API 래퍼
├── supabase/
│   ├── migrations/         # 테이블 생성 SQL
│   └── query/              # 시드 데이터 SQL
└── .env.local              # 환경변수 (git 제외)
```

## 설치 및 실행

### 1. 패키지 설치

```bash
cd nosil-app
npm install
```

### 2. 환경변수 설정

`.env.local` 파일에 아래 3개 키를 설정합니다:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=your_supabase_anon_key
EXPO_PUBLIC_CLAUDE_API_KEY=your_claude_api_key
```

### 3. Supabase 설정

1. [Supabase 대시보드](https://supabase.com/dashboard)에서 SQL Editor 열기
2. `supabase/migrations/001_create_tables.sql` 실행 (테이블 생성)
3. `supabase/query/` 폴더의 SQL 파일을 순서대로 실행 (시드 데이터):
   - `seed_categories.sql`
   - `seed_treatments.sql`
   - `seed_hospitals.sql`
   - `seed_concerns.sql`
   - `seed_botox_brands.sql`

### 4. Expo Go로 실행

```bash
npx expo start
```

- 같은 Wi-Fi에 연결된 폰에서 **Expo Go** 앱으로 QR코드 스캔
- Android: Expo Go 앱 내 QR 스캐너
- iOS: 카메라 앱으로 QR 스캔

### 5. APK 빌드 (나중에)

```bash
npx eas build -p android --profile preview
```

## Claude API 키 발급

1. [console.anthropic.com](https://console.anthropic.com) 접속
2. 회원가입/로그인
3. Settings > API Keys > Create Key
4. 생성된 키(`sk-ant-...`)를 `.env.local`의 `EXPO_PUBLIC_CLAUDE_API_KEY`에 입력

사용하는 기능:
- **AI 상담 (chat)**: `claude-sonnet-4-20250514` 모델, 텍스트 대화
- **AI 추천 (recommend)**: 같은 모델, 이미지(피부 사진) 분석

요금: 사용량 기반 과금 (pay-as-you-go). 월 $5 크레딧으로 시작 가능.

## 주요 기능

| 기능 | 설명 |
|------|------|
| AI 맞춤 추천 | 피부 사진을 Claude가 분석해 시술 조합 추천 |
| 시술 백과 | 58개 시술의 효과, 통증, 가격, 애프터케어 정보 |
| 병원 찾기 | 67개 병원 지역별 검색 + 전화 연결 |
| 데일리 케어 | 날씨 기반 스킨케어 루틴 + 시술 후 관리 |
| 내 시술 기록 | 시술 이력, 스케줄, 조합 분석 |
| AI 상담 | Claude 기반 피부 시술 상담 채팅 |
