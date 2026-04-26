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
      case "lib_create_book":
        tourSteps = [
          {
            target: "body",
            content: "Це гайд: Створення книги з автогенерацією метаданих.",
            placement: "center",
          },
        ];
        break;
      case "admin_users":
        tourSteps = [
          {
            target: "body",
            content: "Це гайд: Керування користувачами та ролями.",
            placement: "center",
          },
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
