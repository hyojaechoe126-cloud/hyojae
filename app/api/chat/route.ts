import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "API_KEY_MISSING",
          message:
            "로컬 환경변수 또는 Vercel 프로젝트 환경변수에 OPENAI_API_KEY가 등록되어 있지 않습니다. 관리자 대시보드 또는 Vercel 설정을 확인해 주세요.",
        },
        { status: 400 }
      );
    }

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "올바르지 않은 메시지 형식입니다." },
        { status: 400 }
      );
    }

    // AI 과학 튜터 페르소나를 위한 시스템 프롬프트 정의
    const systemPrompt = {
      role: "system",
      content:
        "당신은 초중고등학생의 과학 학습을 돕고 과학의 신비한 개념을 쉽게 설명해주는 인공지능 과학 선생님 '싸이언(Scien)'입니다. " +
        "사용자가 과학 퀴즈나 문제를 만들어달라고 하면, 적절한 난이도의 객관식(보기 3~4개) 또는 단답형 문제를 해설과 함께 출제해 주세요. " +
        "개념 질문을 하면 학생들이 이해하기 쉬운 비유와 예시를 들어 친절하고 흥미진진하게 대답해 주어야 합니다. " +
        "모든 답변은 정중하고 다정한 한국어 말투(~요, ~습니다)를 사용해 주세요.",
    };

    // 시스템 프롬프트를 대화 맥락 최상단에 주입
    const fullMessages = [systemPrompt, ...messages];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: fullMessages,
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API 호출 에러 응답:", errorData);
      return NextResponse.json(
        {
          error: "OPENAI_API_ERROR",
          message: errorData.error?.message || "OpenAI API 호출 중 실패했습니다.",
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message;

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("Route Handler Catch Error:", error);
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "서버 내부 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
