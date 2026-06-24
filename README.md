# HyoJae Edu - 교육용 웹앱 보일러플레이트

Vercel을 통해 즉시 배포할 수 있는 가장 단순하고 깔끔한 Next.js 15 + Tailwind CSS v4 기반의 교육용 웹앱 뼈대 코드입니다.

## 🚀 프로젝트 특징

- **Vercel 원클릭 빌드 완벽 지원**: 복잡한 설정 없이 깃허브 연동만으로 빌드 에러 없이 배포 가능합니다.
- **Tailwind CSS v4 탑재**: 최신 `@tailwindcss/postcss` 통합 방식을 사용하여 빌드 성능을 대폭 개선하였습니다.
- **반응형 프리미엄 디자인**: 스마트폰, 태블릿, 데스크탑을 모두 만족하는 반응형 다크 슬레이트 테마를 적용했습니다.
- **직관적 구조 & 친절한 가이드 주석**: 코드 내에 `[여기에 새로운 컴포넌트를 추가하세요]` 주석이 표기되어 있어 기능 확장이 용이합니다.

---

## 🛠️ 폴더 구조

```text
├── package.json         # 패키지 의존성 및 스크립트 정의
├── tsconfig.json        # TypeScript 빌드 설정 (타입 에러 방지)
├── next.config.ts       # Next.js 15 설정 파일
├── postcss.config.mjs   # Tailwind v4 지원용 PostCSS 설정
├── README.md            # 본 설명서 파일
└── app/
    ├── layout.tsx       # 전체 HTML 레이아웃 및 Google Inter 폰트 설정
    ├── page.tsx         # 메인 페이지 (헤더, 히어로, 푸터 및 가이드 영역)
    └── globals.css      # 전역 CSS 스타일 및 Tailwind v4 라이브러리 임포트
```

---

## 💻 로컬에서 실행하기

> **주의**: 로컬에서 실행하기 위해서는 PC에 **Node.js**가 설치되어 있어야 합니다. (설치되지 않은 경우 Vercel에 바로 배포하여 브라우저에서 확인할 수 있습니다.)

1. **의존성 모듈 설치**
   ```bash
   npm install
   ```

2. **개발 서버 실행**
   ```bash
   npm run dev
   ```
   브라우저에서 `http://localhost:3000`에 접속하여 프로젝트를 확인할 수 있습니다.

---

## 🌐 Vercel에 즉시 배포하기

1. 본 소스 코드가 위치한 폴더를 본인의 **GitHub 저장소(Repository)**에 푸시합니다.
2. [Vercel Dashboard](https://vercel.com/dashboard)에 접속하여 **Add New > Project**를 선택합니다.
3. 해당 GitHub 저장소를 가져오기(Import) 합니다.
4. **Framework Preset**이 **Next.js**로 설정되었는지 확인한 후, **Deploy** 버튼을 누릅니다.
5. 1분 이내에 배포가 완료되며, Vercel이 제공하는 고유 URL을 통해 웹서비스에 즉시 접속할 수 있습니다.
