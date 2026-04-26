import React, { createContext, useContext, useState, ReactNode } from "react";
import { Step } from "react-joyride";

interface TourContextType {
  run: boolean;
  steps: Step[];
  startTour: (tourName: string) => void;
  stopTour: () => void;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export const TourProvider = ({ children }: { children: ReactNode }) => {
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);

  const startTour = (tourName: string) => {
    // We will populate steps depending on the tour name
    // For now we just add a default message or leave empty until individual tours are defined
    let tourSteps: Step[] = [];

    switch (tourName) {
      case "user_rag":
        tourSteps = [
          {
            target: "body",
            content: "Це гайд по Інтелектуальному RAG-пошуку.",
            placement: "center",
          },
        ];
        break;
      case "user_save_books":
        tourSteps = [
          {
            target: "body",
            content: "Це гайд по збереженню книг.",
            placement: "center",
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
  };

  return (
    <TourContext.Provider value={{ run, steps, startTour, stopTour }}>
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
