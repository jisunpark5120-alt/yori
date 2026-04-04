// @ts-nocheck
export const maxDuration = 60; // 10초 제한 해제 (최대 60초)
export const config = { api: { bodyParser: { sizeLimit: '4mb' } } };
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY 환경변수가 Vercel에 설정되지 않았습니다.' });
  }

  const { type, value } = req.body;

  let promptContext = '';
  let parts = [];

  if (type === 'text') {
    parts = [{ text: value }];
  } else if (type === 'link') {
    try {
      let fetchUrl = value;
      // 네이버 블로그는 iframe을 사용하므로 m.blog.naver.com (모바일뷰)로 변환해 본문을 가져옵니다.
      if (fetchUrl.includes('blog.naver.com') && !fetchUrl.includes('m.blog.naver.com')) {
        fetchUrl = fetchUrl.replace('blog.naver.com', 'm.blog.naver.com');
      }
      
      const response = await fetch(fetchUrl);
      const html = await response.text();
      // 매우 간단한 HTML -> Text 변환 (스크립트/스타일 제거)
      let cleanText = html.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
                          .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '')
                          .replace(/<[^>]+>/g, ' ')
                          .replace(/\s+/g, ' ');
      // 토큰 한계 방지를 위해 텍스트 길이 제한 (충분히 크게 2만 5천 여 자로 조절하여 응답 지연 방지)
      cleanText = cleanText.substring(0, 25000); 
      parts = [{ text: `아래 제공된 웹페이지 문서 내용에서 요리 레시피를 찾아 추출해줘:\n\n${cleanText}` }];
    } catch (e) {
      return res.status(500).json({ error: '해당 링크의 내용을 읽어오는데 실패했습니다.' });
    }
  } else if (type === 'image') {
    // client assumes base64 input like "data:image/jpeg;base64,......."
    const base64Data = value.split(',')[1];
    const mimeType = value.split(';')[0].split(':')[1];
    if (!base64Data || !mimeType) {
      return res.status(400).json({ error: '잘못된 이미지 포맷 전송.' });
    }
    parts = [
      { text: "이 요리/레시피 이미지에서 요리 정보를 추출해줘." },
      { inlineData: { mimeType, data: base64Data } }
    ];
  } else {
    return res.status(400).json({ error: '지원하지 않는 입력 타입입니다.' });
  }

  const prompt = `
당신은 최고의 요리 레시피 파싱 전문가입니다. 입력된 텍스트, 이미지, 혹은 웹페이지 내용에서 레시피 정보를 추출하여 반드시 아래 포맷의 순수 JSON으로 응답해야 합니다. 마크다운(\`\`\`json)으로 감싸지 마세요.
{
  "title": "요리 제목",
  "emoji": "요리에 어울리는 이모지 하나 (예: 🥘)",
  "cookingTime": "조리시간 (예: 30분, 모르면 null)",
  "ingredients": ["재료 1", "재료 2", ...],
  "instructions": ["조리 순서 1", "조리 순서 2", ...]
}
정보가 부족한 경우 적절히 유추하여 내용을 채워넣어 주세요.`;

  try {
    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: prompt }] },
        contents: [{ parts }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      return res.status(500).json({ error: 'Gemini API 호출 실패', details: errBody });
    }

    const data = await geminiRes.json();
    let resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!resultText) {
      return res.status(500).json({ error: 'AI 응답 파싱 실패 (결과 없음)' });
    }

    // fallback: incase gemini returns markdown chunk despite mimeType config
    resultText = resultText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    
    const resultJson = JSON.parse(resultText);
    return res.status(200).json(resultJson);

  } catch (err) {
    return res.status(500).json({ error: '백엔드 처리 중 에러 발생', details: err.message });
  }
}
