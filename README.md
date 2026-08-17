# Brew Board

Next.js 기반의 팀 커피 공동주문 프로토타입입니다. 현재는 Supabase나 실제 DB를 연결하지 않고 React local state, sessionStorage, localStorage로 동작합니다.

## URL 구조

- `/` — 시작 화면
- `/team/new` — 팀 생성 및 팀원 등록
- `/team/[teamCode]` — 팀 주문 목록
- `/team/[teamCode]/order/new` — 새 주문 생성
- `/team/[teamCode]/order/[orderCode]` — 주문 상세

## 데이터 모델

`TEAM → TEAM_MEMBER → ORDER → ORDER_RESPONSE`

개인 메뉴 선호는 팀과 별개로 `USER + CAFE` 기준으로 mock data에서 계산합니다.

## 실행

```bash
npm install
npm run dev
```

검증 명령:

```bash
npm run lint
npm run build
```
