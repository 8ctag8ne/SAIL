import React, { useState, useEffect } from 'react';
import ConfirmDialog from '../../ui/ConfirmDialog';
import { processBookForRag, getProcessBookStatus } from '../../../api/AiApi';
import { toast } from 'react-fox-toast';

interface RagIndexDialogProps {
  open: boolean;
  bookId: number;
  onClose: () => void;
}

const RagIndexDialog: React.FC<RagIndexDialogProps> = ({ open, bookId, onClose }) => {
  const [internalState, setInternalState] = useState<"idle" | "polling">("idle");

  useEffect(() => {
    if (!open) {
      setInternalState("idle");
    }
  }, [open]);

  const handleStart = async (): Promise<void> => {
    setInternalState("polling");
    
    try {
      const { taskId } = await processBookForRag(bookId);

      return new Promise<void>((resolve) => {
        const poll = setInterval(async () => {
          try {
            const statusResult = await getProcessBookStatus(taskId);
            if (statusResult.status === 'completed' || statusResult.status === 'success') {
              clearInterval(poll);
              toast.success('Книгу успішно проіндексовано', { isCloseBtn: true });
              resolve();
              onClose();
            } else if (statusResult.status === 'failed') {
              clearInterval(poll);
              toast.error(statusResult.error || 'Невідома помилка під час обробки.', { isCloseBtn: true });
              resolve();
              onClose();
            }
          } catch (pollErr) {
            clearInterval(poll);
            toast.error('Помилка під час відстеження статусу.', { isCloseBtn: true });
            resolve();
            onClose();
          }
        }, 3000);
      });
    } catch (err) {
      toast.error('Не вдалося розпочати індексацію.', { isCloseBtn: true });
      // resolve right away since it failed
    }
  };

  const dialogTitle = internalState === "polling" 
    ? "Обробка книги... Будь ласка, не закривайте вікно" 
    : "Ви впевнені, що хочете розпочати ШІ-аналіз цієї книги? Це може зайняти кілька хвилин.";

  return (
    <ConfirmDialog
      open={open}
      title={dialogTitle}
      onConfirm={handleStart}
      onCancel={onClose}
      confirmColor="primary"
      confirmText="Розпочати"
    />
  );
};

export default RagIndexDialog;
