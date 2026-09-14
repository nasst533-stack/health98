// 식품의약품안전처(공공데이터포털)에서 미리 받아둔 "전국통합식품영양성분정보"
// (가공식품 + 음식/외식 데이터, 총 69,495건)를 food-db.json 파일 형태로 이 앱
// 안에 그대로 포함해서 씁니다.
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
export async function searchLocalFoodDb(query, limit = 30) {
    const q = query.trim();
    if (!q)
        return [];
    const rows = await loadDb();
    const results = [];
    for (let i = 0; i < rows.length && results.length < limit; i++) {
        if (rows[i][0].includes(q))
            results.push(rowToFood(rows[i]));
    }
    return results;
}
