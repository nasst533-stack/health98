// 여러 화면에서 함께 쓰는 날짜/탄단지 계산 helper 모음.

// toISOString()은 UTC 기준이라 자정 근처에 한국 시간과 하루 어긋날 수 있어서
// 로컬 타임존 기준으로 YYYY-MM-DD를 직접 만듭니다.
export function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function daysAgoStr(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// offset=0 -> 오늘을 포함한 최근 7일, offset=1 -> 그 이전 7일, ...(과거로 갈수록 커짐)
export function weekDates(offset) {
  const arr = [];
  for (let i = 6; i >= 0; i--) arr.push(daysAgoStr(offset * 7 + i));
  return arr;
}

// Firestore 색인(index) 에러 메시지에서 "색인 만들기" 링크를 뽑아내는 helper.
// 특정 조합의 조회(예: 프로필별 + 날짜순 정렬)를 처음 실행하면 Firestore가 색인을
// 만들라고 안내하는데, 이 에러를 못 잡아두면 화면엔 그냥 "아무 데이터도 안 보임"으로만
// 보여서 마치 저장이 안 된 것처럼 오해하기 쉬워요. 그래서 에러를 잡아 안내 문구+링크로 보여줍니다.
export function firestoreErrorNotice(err) {
  if (!err) return null;
  const msg = err.message || String(err);
  const linkMatch = msg.match(/https:\/\/console\.firebase\.google\.com\S+/);
  const isIndexError = /requires an index/i.test(msg);
  return {
    message: isIndexError
      ? "데이터를 불러오려면 Firestore 색인(index) 생성이 한 번 필요해요. 아래 링크를 눌러 '만들기'를 누르면 1~2분 뒤 정상적으로 보여요."
      : `데이터를 불러오는 중 문제가 생겼어요. (${msg})`,
    link: linkMatch ? linkMatch[0] : null,
  };
}

// ---------------------------------------------------------------------
// 운동 소모 칼로리 추정 (운동 탭에서 입력한 볼륨/시간을 식단 탭의 순 섭취 칼로리에 반영)
// 정확한 값이 아니라 일반적인 공식을 쓴 "추정치"예요 — 운동/식단/인바디가 서로 영향을
// 주는 느낌을 위한 참고용 숫자입니다.
// ---------------------------------------------------------------------

// 유산소: 사용자가 칼로리를 직접 입력했으면 그 값을 쓰고, 없으면 MET 공식으로 추정
// (MET 7 = 조깅 정도 강도로 가정, 체중은 최신 인바디 값 또는 기본 70kg 사용)
function estimateCardioCalories(log, weightKg) {
  if (log.calories != null) return log.calories;
  const minutes = log.durationMin || 0;
  const met = 7;
  return Math.round((met * 3.5 * weightKg / 200) * minutes);
}

// 근력: 세트 수 기준 러프 추정 (세트당 휴식 포함 약 3분, 분당 약 5kcal로 가정 → 세트당 15kcal)
function estimateStrengthCalories(log) {
  const numSets = (log.sets && log.sets.length) || 0;
  return numSets * 15;
}

// logs(운동 기록 전체) 중 특정 날짜 하루치의 소모 칼로리 추정 합계
export function estimateBurnedCaloriesForDate(logs, date, weightKg) {
  const w = weightKg || 70;
  return logs
    .filter((l) => l.date === date)
    .reduce((sum, l) => sum + (l.type === "cardio" ? estimateCardioCalories(l, w) : estimateStrengthCalories(l)), 0);
}

// ---------------------------------------------------------------------
// 공공데이터(식품의약품안전처_식품영양성분DB정보) 검색 결과 정리용 helper.
// 브라우저에서 이 API를 직접 호출합니다 (별도 서버 없이). 응답의 SERVING_SIZE
// (예: "100g", "1개(30g)")에서 기준량(g)을 뽑아 "100g당" 수치로 환산해요.
// ---------------------------------------------------------------------
function servingGramsFrom(str) {
  if (!str) return 100;
  const m = String(str).match(/([\d.]+)\s*g/i);
  const n = m ? Number(m[1]) : NaN;
  return Number.isFinite(n) && n > 0 ? n : 100;
}

function scaledNum(value, scale, decimals) {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  const factor = Math.pow(10, decimals);
  return Math.round(n * scale * factor) / factor;
}

// AMT_NUM1=에너지(kcal), AMT_NUM3=단백질(g), AMT_NUM4=지방(g),
// AMT_NUM6=탄수화물(g), AMT_NUM24=포화지방산(g) — 이 API 응답 명세 기준.
export function normalizePublicFoodItem(item) {
  if (!item || !item.FOOD_NM_KR) return null;
  const grams = servingGramsFrom(item.SERVING_SIZE);
  const scale = 100 / grams;
  return {
    name: item.FOOD_NM_KR,
    category: item.FOOD_CAT1_NM || null,
    maker: item.MAKER_NM || null,
    kcalPer100g: scaledNum(item.AMT_NUM1, scale, 0),
    protein: scaledNum(item.AMT_NUM3, scale, 1),
    fat: scaledNum(item.AMT_NUM4, scale, 1),
    carb: scaledNum(item.AMT_NUM6, scale, 1),
    saturatedFat: scaledNum(item.AMT_NUM24, scale, 1),
  };
}

export function equipmentLabel(eq) {
  const map = {
    barbell: "바벨",
    dumbbell: "덤벨",
    machine: "머신",
    cable: "케이블",
    bodyweight: "맨몸",
    cardio: "유산소",
    freeweight: "프리웨이트",
  };
  return map[eq] || eq;
}

// ---------------------------------------------------------------------
// 목표별 탄단지(탄수화물:단백질:지방) 목표 비율 (참고용 일반 권장치)
// ---------------------------------------------------------------------
export const TARGET_MACRO_RATIO = {
  다이어트: { carb: 4, protein: 5, fat: 3 }, // 체중 감량기엔 근손실 방지를 위해 단백질 비중을 높임
  유지: { carb: 5, protein: 4, fat: 3 }, // 균형 잡힌 기본 비율
  벌크업: { carb: 6, protein: 4, fat: 3 }, // 증량기엔 활동 에너지원인 탄수화물 비중을 높임
};

export function macroRatioLabel(r) {
  return `${r.carb} : ${r.protein} : ${r.fat}`;
}

export function macroTargetPercents(goal) {
  const r = TARGET_MACRO_RATIO[goal] || TARGET_MACRO_RATIO["유지"];
  const total = r.carb + r.protein + r.fat;
  return {
    carb: Math.round((r.carb / total) * 100),
    protein: Math.round((r.protein / total) * 100),
    fat: Math.round((r.fat / total) * 100),
  };
}

// foodLogs 중 날짜가 date인 것들을 모아 그날의 탄단지 칼로리 비율(%)을 계산합니다.
// (carbG/proteinG/fatG가 기록되지 않은 옛 로그는 계산에서 자연히 제외됩니다.)
export function macroPercentsForDate(foodLogs, date) {
  const dayLogs = foodLogs.filter((l) => l.date === date);
  let carbG = 0, proteinG = 0, fatG = 0, any = false;
  dayLogs.forEach((l) => {
    if (l.carbG != null) { carbG += l.carbG; any = true; }
    if (l.proteinG != null) { proteinG += l.proteinG; any = true; }
    if (l.fatG != null) { fatG += l.fatG; any = true; }
  });
  if (!any) return null;
  const carbKcal = carbG * 4, proteinKcal = proteinG * 4, fatKcal = fatG * 9;
  const total = carbKcal + proteinKcal + fatKcal;
  if (total <= 0) return null;
  return {
    carb: Math.round((carbKcal / total) * 100),
    protein: Math.round((proteinKcal / total) * 100),
    fat: Math.round((fatKcal / total) * 100),
  };
}

export function avgMacroPercents(foodLogs, dates) {
  const pts = dates.map((d) => macroPercentsForDate(foodLogs, d)).filter((p) => p != null);
  if (pts.length === 0) return null;
  return {
    carb: Math.round(pts.reduce((s, p) => s + p.carb, 0) / pts.length),
    protein: Math.round(pts.reduce((s, p) => s + p.protein, 0) / pts.length),
    fat: Math.round(pts.reduce((s, p) => s + p.fat, 0) / pts.length),
  };
}

// ---------------------------------------------------------------------
// 인바디 탭 "비교 요약" 추천 문구 (규칙 기반 — Gemini AI 팁이 없을 때의 기본값)
// ---------------------------------------------------------------------
export function buildRecommendation(
  goal,
  weightDiff,
  avgKcal,
  recentVolume,
  recentCardioMin,
  muscleDiff,
  fatPctDiff,
  macroGap
) {
  let base;
  if (!goal) {
    return {
      title: "목표를 먼저 설정해주세요",
      text: "위에서 다이어트 / 유지 / 벌크업 중 목표를 선택하면, 체중·체성분 추이와 섭취 칼로리·운동량을 비교해서 방향을 제안해드려요.",
    };
  }
  if (weightDiff == null) {
    return {
      title: "인바디 기록이 더 필요해요",
      text: "체중 변화 추이를 비교하려면 인바디 기록을 2회 이상 입력해주세요.",
    };
  }
  if (goal === "다이어트") {
    if (weightDiff <= -0.2) {
      base = { title: "잘 진행되고 있어요", text: `체중이 ${weightDiff}kg 감소했어요. 지금 섭취량(${avgKcal != null ? avgKcal + "kcal/일" : "기록 부족"})과 운동량을 그대로 유지해보세요.` };
    } else if (weightDiff >= 0.2) {
      base = { title: "감량 방향으로 조정이 필요해요", text: `체중이 오히려 늘었어요(+${weightDiff}kg). 하루 섭취 칼로리를 조금 줄이거나, 유산소 운동량을 늘려보는 걸 추천해요.` };
    } else {
      base = { title: "정체 구간이에요", text: `체중 변화가 거의 없어요(${weightDiff}kg). 섭취 칼로리를 소폭 줄이거나 유산소·근력 볼륨을 늘려서 자극을 줘보세요.` };
    }
  } else if (goal === "벌크업") {
    if (weightDiff >= 0.2) {
      base = { title: "잘 늘고 있어요", text: `체중이 +${weightDiff}kg 증가했어요. 근력 볼륨(최근 7일 ${recentVolume.toLocaleString()}kg)도 함께 늘고 있는지 확인하면서 지금 페이스를 유지해보세요.` };
    } else if (weightDiff <= -0.2) {
      base = { title: "증량 방향으로 조정이 필요해요", text: `체중이 줄었어요(${weightDiff}kg). 운동량보다 섭취 칼로리를 늘리는 게 우선이에요 (지금 평균 ${avgKcal != null ? avgKcal + "kcal/일" : "기록 부족"}).` };
    } else {
      base = { title: "정체 구간이에요", text: `체중 변화가 거의 없어요(${weightDiff}kg). 섭취 칼로리를 소폭 늘리고, 근력 운동 볼륨도 점진적으로 늘려보세요.` };
    }
  } else {
    // 유지
    base = { title: "유지 중이에요", text: `체중 변화가 ${weightDiff}kg로 크지 않아요. 지금 섭취량과 운동량 밸런스를 그대로 가져가보세요.` };
  }

  const extra = [];
  if (muscleDiff != null) {
    extra.push(`골격근량은 ${muscleDiff > 0 ? "+" : ""}${muscleDiff}kg${muscleDiff === 0 ? "로 변화 없음" : ""}`);
  }
  if (fatPctDiff != null) {
    extra.push(`체지방률은 ${fatPctDiff > 0 ? "+" : ""}${fatPctDiff}%p${fatPctDiff === 0 ? "로 변화 없음" : ""}`);
  }
  if (extra.length > 0) {
    base.text += ` ${extra.join(", ")} 변화했어요.`;
  }
  if (macroGap) {
    base.text += ` 탄단지 비율은 최근 ${macroGap.label} 비중이 목표보다 ${Math.abs(macroGap.diff)}%p ${macroGap.diff > 0 ? "높아요 — 줄여보세요." : "낮아요 — 늘려보세요."}`;
  }
  return base;
}
