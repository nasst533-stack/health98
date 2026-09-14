// 식품의약품안전처(공공데이터포털)에서 미리 받아둔 "전국통합식품영양성분정보"
// (가공식품 + 음식/외식 데이터)를 food-db.json 파일 형태로 이 앱 안에 그대로
// 포함해서 씁니다. 원본 공공데이터에는 같은 상품이 조사 연도별로 여러 번
// 등록돼 있는 경우가 많아서, 완전히 같은 값(이름·분류·제조사·영양성분)을 가진
// 행은 미리 하나로 합쳐뒀어요 (69,495건 → 50,561건).
//
// 이렇게 하면:
//  - 서버(Cloud Functions)도, API 키도 필요 없어요.
//  - Firestore에는 이 데이터를 넣지 않아요 — food-db.json은 index.html/styles.css
//    처럼 그냥 GitHub Pages가 서빙하는 정적 파일이라서, 아무리 많이 읽어도 Firestore
//    무료 사용량(하루 읽기 횟수 등)을 전혀 쓰지 않아요. Firestore에는 우리가 실제로
//    "+ 추가"한 음식(customFoods)이랑 기록만 쌓여요.
//  - 브라우저가 파일을 한 번 받아오면 그 뒤로는 그냥 메모리에서 바로 검색돼서
//    CORS나 네트워크 문제도 없어요.
//
// food-db.json 형식: [[식품명, 분류, 제조사/업체명, kcal, 단백질, 지방, 탄수화물, 포화지방산], ...]
// (모두 100g/100ml 기준값)
let dbPromise = null;
function loadDb() {
    if (!dbPromise) {
        dbPromise = fetch("./food-db.json")
            .then((res) => {
            if (!res.ok)
                throw new Error(`food-db.json 로드 실패 (${res.status})`);
            return res.json();
        })
            .catch((err) => {
            dbPromise = null; // 실패하면 다음 검색 때 다시 시도할 수 있도록
            throw err;
        });
    }
    return dbPromise;
}
function rowToFood(row) {
    const [name, category, maker, kcal, protein, fat, carb, saturatedFat] = row;
    return {
        name,
        category: category || "공공데이터",
        maker: maker || null,
        kcalPer100g: kcal,
        protein,
        fat,
        carb,
        saturatedFat,
    };
}
// 검색어와 얼마나 잘 맞는지 점수를 매겨서, 매칭되는 게 많은 검색어(예: "도시락")도
// 관련도 높은 것부터 보이게 정렬해요: 이름이 검색어로 시작할수록, 검색어가 앞쪽에
// 있을수록, 이름이 짧고 간결할수록(수식어가 덕지덕지 안 붙을수록) 위로 올라와요.
// 이름에서 못 찾으면 제조사/업체명에서도 찾아요(예: "농심"으로 검색하면 농심 제품이
// 다 나와요) — 다만 이름 매치가 항상 더 위로 오게 점수를 낮춰서(더 안 좋게) 둬요.
function matchScore(name, q) {
    const idx = name.indexOf(q);
    if (idx === -1)
        return null;
    if (name === q)
        return 0;
    if (idx === 0)
        return 1000 + name.length;
    return 2000 + idx * 10 + name.length;
}
export async function searchLocalFoodDb(query, limit = 40) {
    const q = query.trim();
    if (!q)
        return [];
    const rows = await loadDb();
    const scored = [];
    for (let i = 0; i < rows.length; i++) {
        const nameScore = matchScore(rows[i][0], q);
        if (nameScore != null) {
            scored.push({ score: nameScore, row: rows[i] });
            continue;
        }
        const maker = rows[i][2];
        if (maker && maker.includes(q)) {
            scored.push({ score: 9000 + rows[i][0].length, row: rows[i] });
        }
    }
    scored.sort((a, b) => a.score - b.score);
    return scored.slice(0, limit).map((s) => rowToFood(s.row));
}
