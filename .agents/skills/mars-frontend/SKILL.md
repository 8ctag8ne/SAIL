---
name: mars-frontend
description: Інструкції та специфікація для розробки Frontend клієнта на React PWA (Terminal UI, MUI, SSE streaming, Human-in-the-Loop, Modularity).
---

# Скіл: Frontend Розробник (React PWA)

## 1. Архітектура та Технологічний Стек
- **Мова / Фреймворк:** React 19 (PWA), TypeScript 4.9+.
- **UI Фреймворк:** Material UI 7 (`@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`).
- **Стейт-менеджмент & Data Fetching:** `@tanstack/react-query` v5, `axios` (v1.9) з централізованими перехоплювачами JWT токенів.
- **Markdown & SSE Render:** `react-markdown` v10 + `remark-gfm` v4 для динамічного відображення LLM стрімів у реальному часі.
- **Сповіщення & Онбординг:** `react-fox-toast` (кастомна Terminal UI стилізація в `index.css`), `react-joyride` (інтерактивні онбординг-тури через `TourContext`).
- **Генерація документів & PDF:** `@react-pdf/renderer` та `html2pdf.js`.

---

## 2. Принципи Модульності та Перевикористання Компонентів

### 🧩 Суворі правила побудови інтерфейсу:
1. **Максимальна модульність:** Інтерфейс розділено на чіткі шари: атомарні UI-компоненти (`src/components/ui/`), доменні блоки (`src/components/books/`, `src/components/search/`, `src/components/authors/`, `src/components/tags/`), леяути (`src/components/layout/`) та сторінки (`src/pages/`).
2. **Заборона дублювання UI:** **НЕ створювати нові UI-компоненти**, якщо існують готові розширення MUI у `theme.ts` або базові компоненти у `src/components/ui/` (`SearchBar`, `LoadingIndicator`, `RagSearchView`). Будь-які нові елементи мають компонуватися з наявних атомарних блоків.
3. **Централізована стилізація:** Заборонено використовувати випадкові хардкодні стилі. Усі кольори, відступи, типи та рамки повинні вибиратися виключно з токенів `theme.ts` або глобальних класів `index.css`.

---

## 3. Дизсистема та Естетика (Terminal UI)

### 🎨 Дизайн-токени (`src/theme.ts` & `src/index.css`):
- **Шрифт:** `JetBrains Mono, monospace` (підключено з Google Fonts).
- **Кольорова палітра (Dark Mode):**
  - Глухий темний фон: `default: '#0d0f12'`, `paper: '#15171a'`.
  - Основний акцент (Military Green): `primary: '#7ed321'`.
  - Вторинний акцент (Violet): `secondary: '#b388ff'`.
  - Помилка / Попередження: `error: '#ff5252'`.
  - Текст: `primary: '#e0e0e0'`.
  - Роздільники та рамки: `divider: '#2d2f33'`.
- **Геометрія та Гештальт:**
  - Абсолютно гострі кути: `borderRadius: 0` для всіх компонентів (`MuiButton`, `MuiChip`, `MuiPaper`, `MuiCard`, `MuiDialog`, `MuiFilledInput`).
  - Вимкнені тіні: `shadows: Array(25).fill('none')` (плаский термінальний дизайн).
- **Мікроінтеракції:**
  - Кнопки (`MuiButton`): Інверсія кольору при наведенні (`color: '#0d0f12'`, `backgroundColor: theme.palette.primary.main`).
  - Чіпи (`MuiChip`): Автоматичні дужки навколо тексту `[ label ]`.
  - Поля вводу (`MuiFilledInput`): Зелена рамка `1px solid #7ed321` при фокусі.
  - Тости (`react-fox-toast`): Оверрайд у `index.css` з прямокутними рамками, кольоровим кодуванням типів та термінальною кнопкою закриття `X`.

---

## 4. Каталог Сторінок та Компонентна Архітектура

### 🤖 `RagSearchPage.tsx` — AI Семантичний Пошук
- **Панель налаштувань RAG:**
  - Слайдер креативності / температури (`0.0` – `1.0`).
  - Світчі: Гібридний пошук (`BM25 + pgvector`), Режим роздумів (`Thinking`), Покращення запиту (`Query Rewrite`).
- **Стрімінговий зчитувач SSE:**
  - Пряме підключення до `${BASE_URL}/api/Ai/rag/ask` через `fetch` + `TextDecoder` + `ReadableStreamReader`.
  - Обробка типів подій: `rewritten_query`, `sources`, `questions`, `thinking`, `answer`, `error`.
  - Скасування активної генерації користувачем через `AbortController`.
  - Автоматичний скролінг сторінки донизу під час отримання генеративного потоку.
  - Дворівневе кешування результатів (`sessionStorage` + `memoryCache`).

### 📚 `BookListPage.tsx` & `BookDetailsPage.tsx` — Каталог та Читання
- Каталог військової літератури з пагінацією, фільтрацією та пошуком.
- Вбудований PDF-Viewer та Markdown-Viewer.
- **Human-in-the-Loop Workflow:** Спеціальний операторський інтерфейс для бібліотекарів (`Librarian`/`Admin`) для перегляду та ручного редагування автоекстрагованих Qwen3-VL метаданих (назва, автори, теги, рік) перед збереженням у Supabase.

### 👤 `AuthorListPage.tsx` & `AuthorDetailsPage.tsx`
- Перегляд списку авторів, біографії та пов'язаних видань.

### 🏷️ `TagListPage.tsx` & `TagDetailsPage.tsx`
- Категоризація та навігація за військовими тематичними мітками.

### 👑 `UsersPage.tsx` & `UserProfilePage.tsx`
- Панель адміністрування користувачів: перемикання між вкладками «Всі користувачі» та «Заблоковані», пошуковий фільтр.
- Зміна ролей (`User`, `Librarian`, `Administrator`), редагування профілів, видалення.
- **Модерація та блокування (Ban / Unban):** модальне вікно `BanUserDialog` із зазначенням причини блокування, швидке розблокування з діалогом підтвердження, візуальні бейджі `[ ЗАБЛОКОВАНО ]` та червона підсвітка заблокованих акаунтів.

### 🔑 `LoginPage.tsx` & `RegisterPage.tsx`
- Форми входу та реєстрації з JWT авторизацією, термінальними тост-сповіщеннями та обробкою статусу блокування (`403 Forbidden` із відображенням причини бану).

---

## 5. Протокол Зчитування SSE та Стейт-Менеджмент

- **Axios Interceptor (`src/api/axios.ts`):** Автоматичне додавання заголовка `Authorization: Bearer <token>` з `localStorage` до кожного API-запиту.
- **SSE Stream Protocol:**
  ```typescript
  const response = await fetch(`${BASE_URL}/api/Ai/rag/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    signal: abortController.signal,
    body: JSON.stringify({ query, temperature, enableThinking, useHybridSearch, rewrite })
  });
  ```
- **Парсинг чанків `data: { type, data/text }`:**
  - `rewritten_query`: Відображення перефразованого запиту.
  - `sources`: Відображення джерел із релевантністю сторінок.
  - `thinking`: Потокове накопичення та рендеринг блоку роздумів ШІ.
  - `answer`: Потоковий рендеринг відповіді через `react-markdown` + `remark-gfm`.

---

## 6. Інтерактивний Онбординг (TourContext)
- Інтеграція `react-joyride` для підказки функцій новим користувачам та операторам системи (інтерактивний тур з підсвіткою кнопок пошуку, слайдерів та джерел).
