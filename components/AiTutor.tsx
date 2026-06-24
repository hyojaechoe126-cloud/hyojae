"use client";

import { useState, useEffect, useRef } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

// OpenAI API 키가 없을 때 작동시킬 로컬 과학 퀴즈 데이터베이스
const MOCK_SCIENCE_QUINT = [
  {
    question: "Q. 지구에서 가장 무겁고 강한 중력을 가진 곳은 지구 내부의 어디일까요?\n1) 지각\n2) 맨틀\n3) 외핵\n4) 내핵",
    answer: "4",
    desc: "정답은 4번 '내핵'입니다! 지구의 중심부에 위치한 내핵은 무거운 철과 니켈로 이루어져 있으며, 엄청난 압력과 강한 밀도를 가지고 있어 지구 내부에서 압력과 중력이 최고조에 달하는 영역이랍니다. 🌍"
  },
  {
    question: "Q. 물이 얼어 얼음이 될 때, 부피와 무게는 어떻게 변화할까요?\n1) 부피는 늘어나고 무게는 그대로이다.\n2) 부피와 무게 모두 늘어난다.\n3) 부피는 줄어들고 무게는 늘어난다.\n4) 부피와 무게 모두 그대로이다.",
    answer: "1",
    desc: "정답은 1번입니다! 물이 얼면 물 분자들이 육각형의 빈 공간이 있는 구조로 규칙적으로 결합하면서 부피가 약 9% 늘어나게 돼요. 하지만 그 안에 담긴 물질의 양(무게)은 전혀 변하지 않고 그대로 유지된답니다. ❄️"
  },
  {
    question: "Q. 식물이 햇빛을 받아 이산화탄소와 물로 스스로 양분을 만드는 이 현상을 무엇이라고 할까요?",
    answer: "광합성",
    desc: "정답은 '광합성(Photosynthesis)'입니다! 식물의 엽록체에서 빛에너지를 이용하여 유기물(포도당)과 산소를 합성해내는 마법 같은 생명 활동이랍니다. 🌿"
  }
];

export default function AiTutor() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "안녕하세요! 저는 과학 도우미 튜터 **'싸이언(Scien)'**입니다. ⚛️\n어려운 과학 개념이나 퀴즈 출제 등 궁금한 점이 있다면 무엇이든 물어보세요!",
    },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // 로컬 퀴즈 모드 상태 추적
  const [mockMode, setMockMode] = useState(false);
  const [currentMockIndex, setCurrentMockIndex] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 메시지가 추가될 때마다 채팅 스크롤을 맨 아래로 유도
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  // 서버 API를 호출하여 OpenAI 응답 받기
  const sendToAi = async (chatHistory: Message[]) => {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: chatHistory }),
      });

      const data = await response.json();

      if (!response.ok) {
        // API 키가 존재하지 않는 특수 에러의 경우 로컬 데모 모드로 전환
        if (data.error === "API_KEY_MISSING" || response.status === 400) {
          setMockMode(true);
          return {
            role: "assistant",
            content:
              "⚠️ **[알림: 로컬 데모 퀴즈 모드 전환]**\n현재 OpenAI API 키가 연동되어 있지 않네요! (Vercel 환경변수 또는 `.env.local`에 `OPENAI_API_KEY`를 설정해주세요.)\n\n대신 제가 미리 준비한 **오프라인 과학 퀴즈**를 출제해 드릴게요! 퀴즈를 풀고 싶으시면 아래 퀵 메뉴에서 **'로컬 과학 퀴즈 시작'**을 클릭해 주세요! 😊"
          } as Message;
        }
        throw new Error(data.message || "서버 통신 실패");
      }

      return data.reply as Message;
    } catch (err: any) {
      console.error(err);
      return {
        role: "assistant",
        content: `❌ 에러가 발생했습니다: ${err.message || "연결 상태가 좋지 않습니다."}`,
      } as Message;
    }
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: textToSend };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputVal("");
    setIsLoading(true);

    // 1. 로컬 퀴즈 진행 중일 때의 모크 처리
    if (mockMode && textToSend.includes("로컬 과학 퀴즈 시작")) {
      setCurrentMockIndex(0);
      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: `📢 **지금부터 로컬 과학 퀴즈 1단계 시작합니다!**\n\n${MOCK_SCIENCE_QUINT[0].question}`
        }
      ]);
      setIsLoading(false);
      return;
    }

    if (mockMode && currentMockIndex < MOCK_SCIENCE_QUINT.length) {
      const currentQuiz = MOCK_SCIENCE_QUINT[currentMockIndex];
      const isCorrect = textToSend.trim().toLowerCase() === currentQuiz.answer.toLowerCase();
      
      let nextContent = "";
      if (isCorrect) {
        nextContent = `🎉 **정답입니다!** 👏\n\n${currentQuiz.desc}`;
      } else {
        nextContent = `😢 **아쉬워요! 오답입니다.**\n(작성하신 정답: ${textToSend})\n\n${currentQuiz.desc}`;
      }

      const nextIndex = currentMockIndex + 1;
      setCurrentMockIndex(nextIndex);

      if (nextIndex < MOCK_SCIENCE_QUINT.length) {
        nextContent += `\n\n---\n\n📢 **다음 퀴즈 들어갑니다!**\n\n${MOCK_SCIENCE_QUINT[nextIndex].question}`;
      } else {
        nextContent += `\n\n---\n\n🏁 **축하합니다! 준비된 3문제를 모두 마치셨습니다!**\n환경변수에 OpenAI API Key를 입력하시면 AI 튜터와 자유롭게 무제한으로 대화할 수 있답니다.`;
        setMockMode(false); // 퀴즈 종료
      }

      setMessages([
        ...updatedMessages,
        { role: "assistant", content: nextContent }
      ]);
      setIsLoading(false);
      return;
    }

    // 2. 일반 OpenAI API 통신 모드
    const reply = await sendToAi(updatedMessages);
    setMessages((prev) => [...prev, reply]);
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[1000] font-sans">
      
      {/* 1. 플로팅 챗봇 다이얼로그 (열렸을 때) */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[380px] sm:w-[400px] h-[550px] bg-slate-950/90 backdrop-blur-lg border border-slate-850 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* 헤더 */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3.5 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <div>
                <h4 className="text-sm font-bold leading-none">AI 과학 튜터 싸이언</h4>
                <span className="text-[10px] text-indigo-200 leading-none">
                  {mockMode ? "오프라인 데모 퀴즈 작동 중" : "OpenAI GPT-4o mini 기반"}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors text-lg cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* 대화 내역 컨테이너 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/50">
            {messages.map((msg, index) => {
              const isUser = msg.role === "user";
              return (
                <div key={index} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs whitespace-pre-wrap leading-relaxed border ${
                      isUser
                        ? "bg-indigo-600 border-indigo-500 text-white rounded-br-none"
                        : "bg-slate-900/60 border-slate-800 text-slate-200 rounded-bl-none"
                    }`}
                  >
                    {/* 마크다운 스타일 텍스트 파싱을 간이적으로 적용 */}
                    {msg.content.split("\n").map((line, i) => {
                      // 볼드처리 (**텍스트**)
                      let content = line;
                      const boldRegex = /\*\*(.*?)\*\*/g;
                      const parts = [];
                      let lastIndex = 0;
                      let match;

                      while ((match = boldRegex.exec(line)) !== null) {
                        if (match.index > lastIndex) {
                          parts.push(line.substring(lastIndex, match.index));
                        }
                        parts.push(<strong key={match.index} className="font-extrabold text-white">{match[1]}</strong>);
                        lastIndex = boldRegex.lastIndex;
                      }
                      if (lastIndex < line.length) {
                        parts.push(line.substring(lastIndex));
                      }

                      return (
                        <p key={i} className={i > 0 ? "mt-1.5" : ""}>
                          {parts.length > 0 ? parts : line}
                        </p>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            
            {/* 로딩 애니메이션 말풍선 */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-900/60 border border-slate-800 text-slate-200 rounded-2xl rounded-bl-none px-4 py-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* 퀵 액션 제안 버튼들 */}
          <div className="px-4 py-2 border-t border-slate-900 bg-slate-950 flex flex-wrap gap-1.5">
            {mockMode ? (
              <button
                onClick={() => handleSend("로컬 과학 퀴즈 시작")}
                className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all cursor-pointer"
              >
                🎮 로컬 과학 퀴즈 시작
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleSend("재미있는 과학 상식 하나 알려줘!")}
                  className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all cursor-pointer"
                >
                  🧪 과학 상식 알려줘
                </button>
                <button
                  onClick={() => handleSend("과학 퀴즈 문제 하나 내줘!")}
                  className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all cursor-pointer"
                >
                  📝 과학 퀴즈 풀기
                </button>
                <button
                  onClick={() => handleSend("광합성 개념이 뭔지 아주 쉽게 설명해줘!")}
                  className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all cursor-pointer"
                >
                  🌿 광합성 개념 설명
                </button>
              </>
            )}
          </div>

          {/* 입력창 */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputVal);
            }}
            className="p-3 border-t border-slate-900 bg-slate-950 flex gap-2"
          >
            <input
              type="text"
              placeholder={mockMode ? "정답 숫자를 입력해 주세요..." : "질문을 작성해 보세요..."}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 transition-all"
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              전송
            </button>
          </form>

        </div>
      )}

      {/* 2. 플로팅 서클 버튼 (항상 노출) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white flex items-center justify-center text-2xl shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:-translate-y-1 transition-all transform duration-200 active:scale-90 cursor-pointer"
        title="AI 과학 선생님에게 질문하기"
      >
        💬
      </button>

    </div>
  );
}
