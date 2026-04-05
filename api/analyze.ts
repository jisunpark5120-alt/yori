// @ts-nocheck
export const maxDuration = 60; // 10초 제한 해제 (최대 60초)
export const config = { api: { bodyParser: { sizeLimit: '4mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const sendProgress = (progress, message, result = null) => {
    res.write(`data: ${JSON.stringify({ progress, message, result })}\n\n`);
  };

  const sendError = (errorMsg) => {
    res.write(`data: ${JSON.stringify({ error: errorMsg })}\n\n`);
    res.end();
  };

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return sendError('GEMINI_API_KEY 환경변수가 설정되지 않았습니다.');
  }

  const { type, value } = req.body;
  if (!type || !value) {
    return sendError('잘못된 요청입니다.');
  }

  sendProgress(10, '데이터 수집 시작...');
  let parts = [];

  if (type === 'text') {
    parts = [{ text: value }];
  } else if (type === 'link') {
    try {
      sendProgress(20, '링크 웹페이지 접속 및 텍스트 변환 중...');
      let fetchUrl = value;
      if (fetchUrl.includes('blog.naver.com') && !fetchUrl.includes('m.blog.naver.com')) {
        fetchUrl = fetchUrl.replace('blog.naver.com', 'm.blog.naver.com');
      }
      
      const response = await fetch(fetchUrl);
      const html = await response.text();
      let cleanText = html.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
                          .replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '')
                          .replace(/<[^>]+>/g, ' ')
                          .replace(/\s+/g, ' ');
      cleanText = cleanText.substring(0, 25000); 
      parts = [{ text: `아래 제공된 웹페이지 문서 내용에서 요리 레시피를 찾아 추출해줘:\n\n${cleanText}` }];
    } catch (e) {
      return sendError('해당 링크의 내용을 읽어오는데 실패했습니다.');
    }
  } else if (type === 'image') {
    sendProgress(20, '이미지 데이터 병합 및 전처리 중...');
    const images = Array.isArray(value) ? value : [value];
    parts = [
      { text: "이 요리/레시피 이미지들에서 요리 레시피 정보를 추출해줘. 만약 서로 다른 여러 개의 요리가 있다면 각각 분리해줘." }
    ];
    for (const imgBase64 of images) {
      const base64Data = imgBase64.split(',')[1];
      const mimeType = imgBase64.split(';')[0]?.split(':')?.[1];
      if (base64Data && mimeType) {
        parts.push({ inlineData: { mimeType, data: base64Data } });
      }
    }
    if (parts.length === 1) {
      return sendError('유효한 이미지가 없습니다.');
    }
  } else {
    return sendError('지원하지 않는 입력 타입입니다.');
  }

  const prompt = `
당신은 최고의 요리 레시피 파싱 전문가입니다. 주어진 내용(텍스트, 이미지, 링크 본문)을 분석하여 레시피를 추출하세요.
제공된 문서나 이미지 내에 여러 개의 전혀 다른 요리 레시피가 포함되어 있다면, 각각을 별도의 오브젝트로 분리하세요.
반드시 아래와 같은 JSON 배열(Array) 포맷으로만 응답해야 합니다. 마크다운(\`\`\`json 등)은 절대 사용하지 마세요.

[
  {
    "title": "요리 제목",
    "emoji": "요리에 어울리는 이모지 하나 (예: 🥘)",
    "cookingTime": "조리시간 (예: 30분, 모르면 null)",
    "ingredients": ["재료 1", "재료 2"],
    "instructions": ["조리 순서 1", "조리 순서 2"]
  }
]

정보가 부족한 경우 레시피의 맥락에 맞게 적절히 유추하여 채워넣어 주세요.`;

  try {
    sendProgress(40, '최신 AI(Gemini)에게 요리법 분석을 요청했어요... (최대 30-40초)');
    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
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
      try {
        const errJson = JSON.parse(errBody);
        if (errJson?.error?.code === 429) {
          return sendError('무료 AI 사용량 한도를 초과했습니다 (너무 많은 요청). 1분 정도 기다렸다가 다시 시도해 주시거나 내일 다시 이용해주세요.');
        }
        return sendError(`AI 분석 오류: ${errJson?.error?.message || errBody}`);
      } catch (e) {
        return sendError(`Gemini API 오류: ${errBody}`);
      }
    }

    sendProgress(80, 'AI 응답 수신 완료! 레시피 데이터 다듬는 중...');
    const data = await geminiRes.json();
    let resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!resultText) {
      return sendError('AI 응답 파싱 실패 (결과 없음)');
    }

    resultText = resultText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    const resultJson = JSON.parse(resultText);
    
    sendProgress(100, '모든 분석이 완료되었습니다!', resultJson);
    res.end();

  } catch (err) {
    return sendError('백엔드 처리 중 에러 발생: ' + err.message);
  }
}
