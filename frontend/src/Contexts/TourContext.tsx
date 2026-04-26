import { Box, Typography } from "@mui/material";
import React, { createContext, useContext, useState, ReactNode } from "react";
import { Step } from "react-joyride";

interface TourContextType {
  run: boolean;
  setRun: (run: boolean) => void;
  steps: Step[];
  stepIndex: number;
  setStepIndex: (index: number) => void;
  activeTour: string | null;
  startTour: (tourName: string) => void;
  stopTour: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const TourProvider = ({ children }: { children: ReactNode }) => {
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [activeTour, setActiveTour] = useState<string | null>(null);

  const startTour = (tourName: string) => {
    setStepIndex(0);
    setActiveTour(tourName);
    // We will populate steps depending on the tour name
    // For now we just add a default message or leave empty until individual tours are defined
    let tourSteps: Step[] = [];

    switch (tourName) {
      case "guest_navigation":
        tourSteps = [
          {
            target: window.innerWidth >= 1200 ? ".tour-logo-desktop" : ".tour-logo-mobile",
            content: "Вітаємо в MARS! Натисніть на логотип у будь-який час, щоб повернутися на головну сторінку бібліотеки.",
            placement: "bottom",
            skipBeacon: true,
          },
          {
            target: ".tour-search-bar",
            content: "Використовуйте цей рядок пошуку, щоб швидко знайти книги за назвою, автором або ключовим словом.",
            placement: "top",
          },
          {
            target: ".tour-tag-filter",
            content: "Натисніть тут, щоб відкрити фільтри. Ви можете звузити пошук, обравши конкретні теги, наприклад 'Тактика'.",
            placement: "top",
          },
          {
            target: ".tour-author-link",
            content: "Це посилання на автора. Натиснувши на ім'я, ви перейдете до його профілю, де зібрані всі його опубліковані роботи в архіві.",
            placement: "top",
          },
          {
            target: ".tour-book-card",
            content: "Це картка книги. Натисніть на неї, щоб переглянути детальну інформацію про документ.",
            placement: "auto",
          },
          {
            target: ".tour-read-button",
            content: "На сторінці книги скористайтеся цією кнопкою, щоб читати документ прямо в браузері.",
            placement: "top",
          },
          {
            target: ".tour-download-button",
            content: "Або скористайтеся цією кнопкою, щоб завантажити документ для доступу офлайн.",
            placement: "right",
          },
        ];
        break;

      case "user_save_books":
        tourSteps = [
          {
            target: ".tour-book-card-menu",
            content: "Щоб зберегти книгу, натисніть на цю іконку з трьома крапками на картці книги.",
            placement: "auto",
            skipBeacon: true,
            styles: { buttonPrimary: { display: "none" } }
          },
          {
            target: ".tour-add-to-list-option",
            content: "Тепер оберіть опцію 'Додати до списку'.",
            placement: "right",
            skipBeacon: true,
            styles: { buttonPrimary: { display: "none" } }
          },
          {
            target: ".tour-list-modal-create",
            content: "Ви можете створити новий список, вказавши назву, опис та налаштувавши приватність (тільки для вас або публічний).",
            placement: "bottom",
            skipBeacon: true,
          },
          {
            target: ".tour-list-modal-select",
            content: "Або виберіть існуючий список із переліку та натисніть кнопку додавання.",
            placement: "bottom",
            skipBeacon: true,
          },
          {
            target: ".tour-list-modal-close",
            content: "Готово! Книга у вашому списку. Видалити її або переглянути всі збережені матеріали можна у вашому Профілі.",
            placement: "center",
            skipBeacon: true,
            locale: { last: "Завершити" }
          },
        ];
        break;
      case "lib_create_book": {
        const isMobileTour = window.innerWidth < 1200;
        const initialSteps: Step[] = isMobileTour
          ? [
            {
              target: ".tour-mobile-menu-btn",
              content: "Відкрийте бічне меню навігації.",
              placement: "bottom",
              skipBeacon: true,
              styles: { buttonPrimary: { display: "none" } }
            },
            {
              target: ".tour-mobile-add-btn",
              content: "Натисніть 'Додати книгу', щоб відкрити форму.",
              placement: "bottom",
              skipBeacon: true,
              styles: { buttonPrimary: { display: "none" } }
            }
          ]
          : [
            {
              target: ".tour-desktop-add-btn",
              content: "Натисніть на іконку '+', щоб відкрити меню додавання.",
              placement: "bottom",
              skipBeacon: true,
              styles: { buttonPrimary: { display: "none" } }
            },
            {
              target: ".tour-desktop-menu-book",
              content: "Оберіть 'Книга', щоб відкрити форму додавання.",
              placement: "bottom",
              skipBeacon: true,
              styles: { buttonPrimary: { display: "none" } }
            }
          ];

        tourSteps = [
          ...initialSteps,
          {
            target: ".tour-upload-pdf",
            content: "Спочатку завантажте PDF-файл документа. Це обов'язковий крок для подальшої роботи.",
            placement: "bottom",
            skipBeacon: true,
          },
          {
            target: ".tour-cover-actions",
            content: "Тут ви можете завантажити власну обкладинку (Завантажити фото) або використати фото першої сторінки документа за замовчуванням (Звичайна обкладинка).",
            placement: "bottom",
            skipBeacon: true,
          },
          {
            target: ".tour-ai-analyze",
            content: "Кнопка 'Аналізувати книгу' — це магія ШІ! Вона розпарсить документ і автоматично заповнить порожні поля назви, опису, авторів та тегів. Заповнені вручну поля не перезапишуться. Ви завжди зможете відредагувати результат.",
            placement: "bottom",
            skipBeacon: true,
          },
          {
            target: ".tour-book-basic-info",
            content: "Поля 'Назва' та 'Опис' відображатимуться на картці книги в бібліотеці.",
            placement: "top",
            skipBeacon: true,
          },
          {
            target: ".tour-book-multiselects",
            content: "Мультиселекти для Авторів та Тегів. Ви можете обирати існуючі або вписувати нові і натискати 'Створити'. Нові сутності будуть додані в базу даних лише після фінального збереження книги.",
            placement: "top",
            skipBeacon: true,
          },
          {
            target: ".tour-submit-book",
            content: "Після заповнення натисніть 'Додати книгу'. Книга збережеться в базі і буде доступна для перегляду та індексації RAG-системою. Цю кнопку зараз натискати не обов'язково.",
            placement: "top",
            skipBeacon: true,
            locale: { last: "Завершити" }
          },
        ];
        break;
      }
      case "admin_users": {
        const isMobileTour = window.innerWidth < 1200;
        const initialSteps: Step[] = isMobileTour
          ? [
            {
              target: ".tour-mobile-menu-btn",
              content: "Спочатку відкрийте бічне меню навігації.",
              placement: "bottom",
              skipBeacon: true,
              styles: { buttonPrimary: { display: "none" } }
            },
            {
              target: ".tour-nav-users-mobile",
              content: "Тепер перейдіть до розділу 'Користувачі'.",
              placement: "bottom",
              skipBeacon: true,
              styles: { buttonPrimary: { display: "none" } }
            }
          ]
          : [
            {
              target: ".tour-nav-users-desktop",
              content: "Перейдіть до розділу 'Користувачі', щоб керувати доступами.",
              placement: "bottom",
              skipBeacon: true,
              styles: { buttonPrimary: { display: "none" } }
            }
          ];

        tourSteps = [
          ...initialSteps,
          {
            target: ".tour-user-card-menu",
            content: "Тут ви бачите список користувачів. Іконки на картках позначають їхні поточні ролі. Натисніть на три крапки біля будь-якого користувача.",
            placement: "auto",
            skipBeacon: true,
            styles: { buttonPrimary: { display: "none" } }
          },
          {
            target: ".tour-user-action-edit",
            content: "Ви можете видалити користувача, або змінити його дані. Оберіть 'Редагувати'.",
            placement: "right",
            skipBeacon: true,
            styles: { buttonPrimary: { display: "none" } }
          },
          {
            target: ".tour-user-name-email",
            content: "Модалка редагування. 'Ім'я' та 'Email' — обов'язкові поля. Email використовується для ідентифікації при вході.",
            placement: "bottom",
            skipBeacon: true,
          },
          {
            target: ".tour-user-info-phone",
            content: "Поля 'Інформація' та 'Номер телефону' є опціональними.",
            placement: "bottom",
            skipBeacon: true,
          },
          {
            target: ".tour-user-role-select",
            content: (
              <Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Найважливіше — <strong>'Роль'</strong>:
                </Typography>
                <Box component="ul" sx={{ mt: 0, pl: 2, mb: 1, textAlign: 'left' }}>
                  <li><strong>User:</strong> базовий пошук і читання.</li>
                  <li><strong>Librarian:</strong> додавання книг та RAG-індексація.</li>
                  <li><strong>Admin:</strong> повний доступ до системи.</li>
                </Box>
                <Typography variant="body2" color="error.main">
                  Змінюйте ролі обережно!
                </Typography>
              </Box>
            ),
            placement: "top",
            skipBeacon: true,
            locale: { last: "Завершити" }
          }
        ];
        break;
      }
      case "lib_rag_index":
        tourSteps = [
          {
            target: "body",
            content: (
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}>
                  Навіщо потрібна індексація?
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Коли ви просто додаєте книгу, вона з'являється на сайті, але штучний інтелект (RAG) її ще <strong>«не бачить»</strong>.
                </Typography>
                <Typography variant="body2">
                  Щоб ШІ міг використовувати документ для відповідей на запитання, книгу необхідно <strong>проіндексувати</strong> — розбити текст на фрагменти та перетворити їх у математичні вектори.
                </Typography>
              </Box>
            ),
            placement: "center",
            skipBeacon: true,
          },
          {
            target: ".tour-book-card-menu",
            content: "Щоб розпочати, знайдіть потрібну книгу на головній сторінці та натисніть на цю іконку з трьома крапками.",
            placement: "auto",
            skipBeacon: true,
            styles: { buttonPrimary: { display: "none" } }
          },
          {
            target: ".tour-index-option",
            content: (
              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="body2" sx={{ mb: 1.5 }}>
                  У меню оберіть опцію <strong>«Згенерувати RAG-індекс (AI)»</strong>. Після її натискання з'явиться вікно підтвердження.
                </Typography>

                <Box
                  sx={{
                    p: 1.5,
                    borderLeft: '3px solid',
                    borderColor: 'error.main',
                    backgroundColor: 'rgba(255, 82, 82, 0.1)',
                    mb: 1.5
                  }}
                >
                  <Typography variant="body2" color="error.main" sx={{ fontWeight: 'bold' }}>
                    Увага: індексація може тривати кілька хвилин. Під час генерації категорично НЕ МОЖНА закривати модальне вікно, інакше процес перерветься.
                  </Typography>
                </Box>

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontStyle: 'italic' }}>
                  *Зараз натискати опцію не обов'язково. Щоб завершити гайд, просто натисніть кнопку нижче.
                </Typography>
              </Box>
            ),
            placement: "right",
            skipBeacon: true,
            locale: { last: "Завершити" }
          }
        ];
        break;
      case "user_rag":
        tourSteps = [
          {
            target: ".tour-rag-controls",
            content: "Тут ви можете задати питання системі. Слайдер температури дозволяє налаштувати креативність штучного інтелекту: нижче значення — точніша відповідь, вище — більш розгорнута.",
            placement: "bottom",
            skipBeacon: true,
          },
          {
            target: ".tour-rag-sources",
            content: "Це джерела, знайдені в архіві. Відсотки показують семантичну подібність фрагмента до вашого запиту. Натисніть на джерело, щоб перейти до оригінальної книги.",
            placement: "bottom",
            skipBeacon: true,
          },
          {
            target: ".tour-rag-answer",
            content: "Ось згенерована відповідь на основі знайдених джерел. Пам'ятайте: ШІ може помилятися, і його відповіді залежать виключно від поточної бази знань.",
            placement: "top",
            skipBeacon: true,
          },
          {
            target: ".tour-rag-related",
            content: "Внизу сторінки ви знайдете схожі запитання, які можуть допомогти глибше дослідити тему.",
            placement: "top",
            skipBeacon: true,
          },
        ];
        break;
      default:
        tourSteps = [
          {
            target: "body",
            content: "Ласкаво просимо до туру!",
            placement: "center",
          },
        ];
        break;
    }

    setSteps(tourSteps);
    setRun(true);
  };

  const stopTour = () => {
    setRun(false);
    setActiveTour(null);
  };

  return (
    <TourContext.Provider value={{ run, setRun, steps, stepIndex, setStepIndex, activeTour, startTour, stopTour }}>
      {children}
    </TourContext.Provider>
  );
};

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
};
