# UI/CSS 마이그레이션 체크리스트

원본: `노실장 데모 최종.jsx` → 대상: Expo React Native (`nosil-app/`)

## 플랫폼 제한 (수정 불가)

- [ ] Cormorant Garamond → Georgia 대체 (RN에서 웹폰트 불가)
- [x] linear-gradient → expo-linear-gradient 적용 (record.tsx, daily.tsx bottomBar)
- [ ] textUnderlineOffset → 미지원
- [ ] textDecorationColor → 제한적 지원
- [x] typing dots 애니메이션 → Animated API 적용 (chat.tsx)

---

## app/index.tsx (Home)

- [x] 매거진 그리드 레이아웃 (2col 상단 + 3col 하단)
- [x] logoN: fontSize 23.8, fontFamily Georgia, letterSpacing 2.25
- [x] atelierText: fontSize 9, letterSpacing 2.7
- [x] heroTitle: fontSize 28, lineHeight 28.8, fontFamily Georgia
- [x] heroSub: fontSize 11, lineHeight 17.6, letterSpacing 0.55
- [x] 카드 borderTopWidth 0.5, borderRightWidth 0.5 (borderRadius 없음)
- [x] cardTitle: fontSize 13, fontWeight 500
- [x] cardSub: fontSize 10, color textMuted

## app/recommend.tsx (AI 추천)

- [x] ConcernRadar 렌더링 추가
- [x] cameraButton: paddingTop 32, paddingBottom 28
- [x] loadingBox: paddingHorizontal 18
- [x] comboGood/comboCaution: paddingHorizontal 16
- [x] consultItem: paddingHorizontal 14
- [x] errorBox: paddingHorizontal 14
- [x] analyzeButton: padding 14
- [x] resetButton: padding 13
- [x] photoImage: maxHeight 320
- [x] sectionTitle: fontWeight 500, color textMuted

## app/encyclopedia.tsx (백과사전)

- [x] 아코디언 패턴 (카테고리 확장/축소)
- [x] 검색바 + 검색 결과 플랫 리스트
- [x] catItem: paddingLeft 20, paddingRight 16
- [x] listContent: paddingHorizontal 20, paddingBottom 24, gap 8
- [x] searchIcon: left 14, top 12
- [x] TreatmentDetail 네비게이션 연동

## app/daily.tsx (데일리 케어)

- [x] weatherStatItem: flexDirection row, alignItems center (인라인 배치)
- [x] introText: lineHeight 20.8, letterSpacing 0.55
- [x] treatmentTags: paddingBottom 4
- [x] photoImage: maxHeight 240
- [x] sheetHeader: marginBottom 16
- [x] select view: paddingBottom 8

## app/record.tsx (기록)

- [x] calGrid: gap 4, calCell width 계산 반영
- [x] dateCard: paddingVertical 12, paddingHorizontal 14
- [x] treatmentRow: paddingVertical 12, paddingHorizontal 14
- [x] selectedCard: paddingVertical 14, paddingHorizontal 16
- [x] warningCard: paddingVertical 24, paddingHorizontal 22
- [x] warningList: paddingVertical 10, paddingHorizontal 12
- [x] eventRow: paddingVertical 10, paddingHorizontal 14
- [x] comboGoodItem: lineHeight 18
- [x] comboBadItem: lineHeight 18.6
- [x] modeBtn: paddingVertical 10, paddingHorizontal 12
- [x] dateInputWrap: paddingVertical 10, paddingHorizontal 12
- [x] treatmentList: gap 4

## app/chat.tsx (AI 채팅)

- [x] typing dots (width 6, height 6, borderRadius 3)
- [x] avatarText: fontFamily Georgia
- [x] emptyWrap: paddingTop 24, paddingBottom 20
- [x] inputBar: paddingTop 10, paddingBottom 12
- [x] headerTitle: letterSpacing 0.28
- [x] emptyDesc: lineHeight 19.2
- [x] quickBtnText: lineHeight 17.5
- [x] modalDesc: lineHeight 18.6
- [x] spacer: width 24
- [x] ScrollView: paddingTop 16, paddingHorizontal 14, paddingBottom 14

## app/hospitals.tsx (병원)

- [x] list: paddingHorizontal 20, paddingBottom 24
- [x] backText: fontSize 12
- [x] back icon: size 14
- [x] reviewCard: paddingVertical 14, paddingHorizontal 16
- [x] writeInput: paddingVertical 10, paddingHorizontal 12, lineHeight 19.5
- [x] cardAddr: lineHeight 18.6
- [x] reviewText: lineHeight 20.8
- [x] addrText: lineHeight 19.2
- [x] detailAreaBadge: paddingHorizontal 10, paddingVertical 3, fontSize 11
- [x] list areaBadge: paddingHorizontal 8, paddingVertical 2, fontSize 10
- [x] detail noReview: fontSize 12 / list noReview: fontSize 11

## components/Section.tsx

- [x] marginBottom: 20
- [x] title: fontWeight 500, color textMuted

## components/Stat.tsx

- [x] paddingVertical: 12, paddingHorizontal: 14

## components/ConcernRadar.tsx

- [x] card: paddingTop 18, paddingHorizontal 12, paddingBottom 14
- [x] SVG 레이더 차트 (react-native-svg)

## components/TreatmentDetail.tsx

- [x] content: paddingTop 4, paddingHorizontal 20, paddingBottom 24
- [x] backBtn: paddingVertical 8
- [x] tipCard: paddingVertical 12, paddingHorizontal 14
- [x] successBox/dangerBox/cautionBox: paddingVertical 12, paddingHorizontal 14
- [x] dosageNote: paddingVertical 10, paddingHorizontal 12
- [x] dosageNoteText: lineHeight 17.05
- [x] tipDesc: lineHeight 18.6
- [x] desc: lineHeight 22.1
- [x] bodyText: lineHeight 20.8

## components/StarRating.tsx

- [x] SVG 별점 구현 완료

## components/WebcamModal.tsx

- [x] expo-image-picker 연동
