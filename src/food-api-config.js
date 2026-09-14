// 공공데이터포털 "식품의약품안전처_식품영양성분DB정보" API 설정.
//
// 서버(Cloud Function) 없이 브라우저에서 이 API를 직접 호출합니다. 참고해두세요:
//  - 이 키는 유료 API가 아니라 무료 공공데이터 키라서, 여기 있어도 "요금이 나가는" 일은
//    없어요. 다만 이 저장소가 공개돼 있어서 키도 같이 공개돼요 — 최악의 경우 다른 사람이
//    이 키로 하루 호출 한도를 다 써버리면 우리도 잠깐 검색이 안 될 수 있어요. 그 정도
//    리스크는 감수하기로 하고 이 방식을 씁니다.
//  - 브라우저가 이 API 호출을 CORS로 막으면(가능성 있음), 검색 시 바로 오류 메시지로
//    표시돼요. 그러면 그때 다른 방식(정적 데이터 파일 등)으로 바꾸면 됩니다.
export const FOOD_API_BASE =
  "https://apis.data.go.kr/1471000/FoodNtrCpntDbInfo02/getFoodNtrCpntDbInq02";
export const FOOD_API_KEY =
  "ifsORohjNRwf7lRBUCv+8TBl90oTfvzW/aCAkxPuFqbRcgH6YszqPq9REG0oiUf9Bu4/TmuOnWFvK+rnFswx0Q==";
