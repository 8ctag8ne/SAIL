import React, { createContext, useContext, useState, ReactNode } from "react";
import FeedbackModal from "../components/feedback/FeedbackModal";

interface FeedbackModalOptions {
  category?: string;
}

interface FeedbackContextType {
  openFeedbackModal: (options?: FeedbackModalOptions) => void;
  closeFeedbackModal: () => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export const FeedbackProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<string | undefined>(undefined);

  const openFeedbackModal = (options?: FeedbackModalOptions) => {
    setCategory(options?.category);
    setIsOpen(true);
  };

  const closeFeedbackModal = () => {
    setIsOpen(false);
  };

  return (
    <FeedbackContext.Provider value={{ openFeedbackModal, closeFeedbackModal }}>
      {children}
      <FeedbackModal
        open={isOpen}
        onClose={closeFeedbackModal}
        defaultCategory={category}
      />
    </FeedbackContext.Provider>
  );
};

export const useFeedbackModal = () => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error("useFeedbackModal must be used within a FeedbackProvider");
  }
  return context;
};
