// Mock substitute data for Korean ingredients
const substitutes: Record<string, string[]> = {
  '계란': ['두부 (비건)', '아쿠아파바'],
  '간장': ['코코넛 아미노스', '타마리'],
  '설탕': ['꿀', '매실청', '스테비아', '올리고당'],
  '다진 마늘': ['마늘 분말 (0.5작은술)', '마늘 오일'],
  '참기름': ['들기름', '올리브오일'],
  '청양고추': ['할라피뇨', '페페론치노', '고추냉이 소량'],
  '대파': ['쪽파', '양파', '부추'],
  '마요네즈': ['그릭 요거트', '아보카도'],
  '참치캔': ['닭가슴살캔', '연어캔'],
  '김가루': ['깨', '후리카케'],
  '올리브오일': ['포도씨유', '아보카도오일', '참기름'],
  '레몬즙': ['식초', '라임즙', '유자청'],
  '꿀': ['매실청', '설탕+물', '아가베 시럽', '올리고당'],
  '당근': ['무', '비트', '호박'],
  '소금': ['간장 소량', '맛소금'],
  '후추': ['백후추', '산초'],
  '파슬리': ['깻잎', '고수', '바질'],
  '밥': ['현미밥', '잡곡밥', '곤약밥'],
  '물': [],
};

export function getSubstitutes(ingredient: string): { name: string; alternatives: string[] } | null {
  // Try exact match first, then partial
  for (const [key, alts] of Object.entries(substitutes)) {
    if (ingredient.includes(key) && alts.length > 0) {
      return { name: key, alternatives: alts };
    }
  }
  return null;
}
