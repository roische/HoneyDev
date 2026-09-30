# HoneyDev Fullstack Template

CodeSandbox에서 바로 띄워볼 수 있는 최소 Fullstack 템플릿입니다.

## Structure

- `frontend`: React + Vite
- `backend`: Express + Supabase Server API

## Quick Start

```bash
npm install
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000`

## Environment Variables

### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:4000
VITE_DEFAULT_TABLE_NAME=profiles
VITE_DEFAULT_LIMIT=10
```

### Backend (`backend/.env`)

```env
PORT=4000
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_secret_or_service_role_key
```

> `SUPABASE_SERVICE_ROLE_KEY`는 서버 전용입니다. 프론트엔드에 절대 노출하지 마세요.

## API Endpoints

- `GET /api/health`
- `GET /api/table/:tableName?limit=20`

Example:

```bash
curl "http://localhost:4000/api/table/profiles?limit=5"
```

## GitHub 반영 후 main 적용 절차

1. 작업 브랜치 push
2. GitHub Pull Request 생성
3. PR에서 코드 리뷰/확인
4. Merge 후 `main` 최신화

## CodeSandbox 연결

브랜치를 바로 열 때:

```text
https://codesandbox.io/p/github/<OWNER>/<REPO>/tree/<BRANCH>
```

예시:

```text
https://codesandbox.io/p/github/roische/HoneyDev/tree/cursor/fullstack-codesandbox-849f
```

1. 이 저장소를 GitHub에 push
2. CodeSandbox에서 repo 또는 브랜치 열기
3. Secrets(환경변수)에 `frontend/.env`, `backend/.env` 값 추가
4. 서버 실행:
   - 전체 실행: `npm run dev`
   - 프론트만: `npm run dev:frontend`
   - 백엔드만: `npm run dev:backend`
