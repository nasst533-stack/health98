// 음식 kcal / 영양소 목록 (100g 기준).
// source: "api"  = 식품의약품안전처 식품영양성분DB 공공API(FoodNtrCpntDbInfo02) 실측값
//         "ref"  = 이 API에서 순수 원재료 형태를 못 찾아 넣은 일반 참고값(표준 영양정보)
// protein/fat/carb(g)는 탄단지 비율 계산에 쓰입니다.
// saturatedFat(g, 포화지방)은 이 API에서 신뢰 가능한 필드를 찾지 못해 전부 참고용 추정치입니다 (satFatSource: "ref").
// unitLabel/unitGrams가 있으면 "개/장" 같은 개수 단위로도 기록할 수 있습니다 (예: 달걀 1개 ≈ 45g).
// 더 많은 음식이 필요하면 이름만 알려주세요 — API에서 검색해서 추가해 드립니다.

let _id = 0;
const nextId = () => `food_${++_id}`;

function make(name, kcalPer100g, category, opts) {
  opts = opts || {};
  return {
    id: nextId(),
    name,
    kcalPer100g,
    category: category || "기타",
    protein: opts.p != null ? opts.p : null,
    fat: opts.f != null ? opts.f : null,
    carb: opts.c != null ? opts.c : null,
    saturatedFat: opts.sat != null ? opts.sat : null,
    satFatSource: "ref", // 포화지방은 항상 참고용 추정치
    source: opts.source || "ref",
    unitLabel: opts.unitLabel || null,
    unitGrams: opts.unitGrams != null ? opts.unitGrams : null,
    builtin: true,
  };
}

export const DEFAULT_FOODS = [
  // ---- 곡류/밥 (API) ----
  make("백미밥", 148, "곡류", { p: 2.6, f: 0.2, c: 30.1, sat: 0.05, source: "api" }),
  make("현미밥", 172, "곡류", { p: 3.1, f: 0.47, c: 38.9, sat: 0.1, source: "api" }),
  make("고구마 (찐것)", 139, "곡류", { p: 1.67, f: 0.24, c: 32.47, sat: 0.05, source: "api" }),

  // ---- 달걀/두부 (API) ----
  make("달걀부침 (달걀후라이)", 208, "달걀", { p: 15.73, f: 13.78, c: 5.15, sat: 3.0, source: "api", unitLabel: "개", unitGrams: 45 }),
  make("달걀말이", 193, "달걀", { p: 17.21, f: 13.21, c: 1.45, sat: 3.0, source: "api" }),
  make("삶은 달걀", 155, "달걀", { p: 12.6, f: 10.6, c: 1.1, sat: 3.3, unitLabel: "개", unitGrams: 50 }),
  make("두부부침", 140, "콩류", { p: 10.92, f: 9.77, c: 2.07, sat: 1.4, source: "api" }),
  make("두부조림", 143, "콩류", { p: 9.64, f: 9.66, c: 4.40, sat: 1.4, source: "api" }),

  // ---- 닭/생선 (API) ----
  make("닭가슴살 샌드위치", 240, "육류", { p: 12.18, f: 11.92, c: 20.96, sat: 2.5, source: "api" }),
  make("닭갈비 (닭가슴살·피망)", 122, "육류", { p: 16.39, f: 5.65, c: 1.38, sat: 1.5, source: "api" }),
  make("닭가슴살튀김", 252, "육류", { p: 21.0, f: 9.7, c: 20.2, sat: 2.0, source: "api" }),
  make("닭가슴살 샐러드 (드레싱)", 37, "육류", { p: 4.1, f: 1.36, c: 2.03, sat: 0.3, source: "api" }),
  make("연어구이", 234, "생선", { p: 24.78, f: 14.94, c: 0.2, sat: 2.3, source: "api" }),

  // ---- 채소 (API) ----
  make("브로콜리무침", 32, "채소", { p: 1.6, f: 0.25, c: 7.01, sat: 0.03, source: "api" }),
  make("브로콜리볶음", 51, "채소", { p: 4.42, f: 1.28, c: 5.53, sat: 0.15, source: "api" }),

  // ---- 국/찌개/한그릇 (API) ----
  make("된장찌개 (두부)", 41, "찌개", { p: 3.25, f: 1.96, c: 2.56, sat: 0.3, source: "api" }),
  make("김치찌개 (돼지고기)", 45, "찌개", { p: 4.25, f: 2.71, c: 1.04, sat: 0.9, source: "api" }),
  make("순두부찌개 (김치)", 35, "찌개", { p: 2.98, f: 1.59, c: 2.17, sat: 0.25, source: "api" }),
  make("두부전골", 63, "찌개", { p: 5.12, f: 3.22, c: 3.42, sat: 0.5, source: "api" }),
  make("볶음밥 (계란)", 225, "곡류", { p: 6.62, f: 11.28, c: 24.23, sat: 2.2, source: "api" }),
  make("흰우유", 60, "유제품", { p: 3.0, f: 3.3, c: 5.0, sat: 2.0, source: "api" }),

  // ---- 정부 식품영양성분DB API에서 실측 조회한 대중적인 음식들 ----
  make("라면 (조리)", 82, "면류", { p: 1.72, f: 2.28, c: 13.65, sat: 0.9, source: "api" }),
  make("비빔밥", 142, "곡류", { p: 6.86, f: 4.32, c: 18.84, sat: 1.0, source: "api" }),
  make("김밥 (참치)", 174, "곡류", { p: 7.00, f: 7.22, c: 20.26, sat: 1.3, source: "api" }),
  make("식빵", 264, "곡류", { p: 9.34, f: 2.60, c: 50.91, sat: 0.6, source: "api", unitLabel: "장", unitGrams: 35 }),

  // ---- 이 API에서 순수 원재료/일치 항목을 찾지 못해 넣은 일반 참고값 ----
  make("닭가슴살 (생것)", 165, "육류", { p: 31, f: 3.6, c: 0, sat: 1.0 }),
  make("바나나", 89, "과일", { p: 1.1, f: 0.3, c: 22.8, sat: 0.1, unitLabel: "개", unitGrams: 120 }),
  make("사과", 52, "과일", { p: 0.3, f: 0.2, c: 13.8, sat: 0.03, unitLabel: "개", unitGrams: 250 }),
  make("그릭요거트 (무가당)", 59, "유제품", { p: 10, f: 0.4, c: 3.6, sat: 0.25 }),
  make("아몬드", 579, "견과류", { p: 21, f: 50, c: 22, sat: 3.8 }),
  make("오트밀 (조리 전)", 389, "곡류", { p: 16.9, f: 6.9, c: 66.3, sat: 1.2 }),
  make("단백질 파우더 (웨이, 100g 기준)", 380, "보충제", { sat: 1.5 }),
  make("배추김치", 25, "채소", { p: 1.6, f: 0.5, c: 4.0, sat: 0.1 }),
  make("삼겹살 구이", 361, "육류", { p: 17.2, f: 31.6, c: 0.4, sat: 11.7 }),
  make("떡볶이", 145, "분식", { p: 2.4, f: 1.6, c: 30.5, sat: 0.4 }),
  make("참치캔 (기름)", 189, "생선", { p: 15.0, f: 14.0, c: 0.3, sat: 2.5 }),
  make("후라이드 치킨", 260, "육류", { p: 20.0, f: 17.0, c: 8.0, sat: 4.0 }),
  make("고구마맛탕", 200, "곡류", { p: 1.0, f: 5.0, c: 38.0, sat: 1.5 }),
  make("짜장면", 128, "면류", { p: 4.0, f: 3.5, c: 20.0, sat: 0.6 }),
  make("미역국", 30, "찌개", { p: 2.0, f: 1.2, c: 2.5, sat: 0.2 }),
  make("감자조림", 95, "채소", { p: 1.5, f: 2.0, c: 18.0, sat: 0.3 }),
  make("소고기 불고기", 178, "육류", { p: 15.5, f: 9.8, c: 6.5, sat: 3.7 }),
];
