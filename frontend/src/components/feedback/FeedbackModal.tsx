import React, { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  DialogTitle,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { toast } from "react-fox-toast";
import { useAuth } from "../../contexts/AuthContext";
import { sendFeedback } from "../../api/FeedbackApi";
import EntityModal from "../ui/EntityModal/EntityModal";
import LoadingIndicator from "../ui/LoadingIndicator";

export interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  defaultCategory?: string;
}

export const FEEDBACK_CATEGORIES = [
  "Пропозиція / побажання",
  "Повідомити про помилку",
  "Запит на додавання книги",
  "Авторське право / Співпраця",
  "Інше",
];

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  open,
  onClose,
  defaultCategory,
}) => {
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState(defaultCategory || FEEDBACK_CATEGORIES[0]);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (user) {
        setName(user.username || "");
        setEmail(user.email || (user.username?.includes("@") ? user.username : ""));
      }
      if (defaultCategory) {
        setCategory(defaultCategory);
      }
    }
  }, [open, user, defaultCategory]);

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Будь ласка, вкажіть ваше ім'я.", { isCloseBtn: true });
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      toast.error("Будь ласка, вкажіть коректний email для відповіді.", { isCloseBtn: true });
      return;
    }

    if (!message.trim()) {
      toast.error("Будь ласка, напишіть текст повідомлення.", { isCloseBtn: true });
      return;
    }

    setIsSubmitting(true);
    try {
      await sendFeedback({
        name: name.trim(),
        email: email.trim(),
        category,
        message: message.trim(),
      });

      toast.success("Ваше повідомлення успішно надіслано!", { isCloseBtn: true });
      setMessage("");
      onClose();
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.message ||
        "Не вдалося надіслати повідомлення. Спробуйте пізніше.";
      toast.error(errorMsg, { isCloseBtn: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <EntityModal open={open} onClose={handleClose}>
      <Paper
        elevation={3}
        sx={{
          width: 500,
          maxWidth: "100%",
          maxHeight: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRadius: 0,
          boxSizing: "border-box",
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          <DialogTitle
            sx={{
              px: { xs: 2, sm: 3 },
              py: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "background.paper",
              borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
              flexShrink: 0,
            }}
          >
            <Typography variant="h6" fontWeight="bold">
              Зворотний зв'язок
            </Typography>
            <IconButton
              onClick={handleClose}
              size="small"
              sx={{ color: "text.secondary", mr: -0.5, p: 0.5 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <Box
            sx={{
              p: { xs: 2, sm: 3 },
              display: "flex",
              flexDirection: "column",
              gap: 2,
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
            }}
          >
            <TextField
              label="Ім'я"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              fullWidth
              disabled={isSubmitting}
            />

            <TextField
              label="Email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              fullWidth
              disabled={isSubmitting}
            />

            <FormControl fullWidth disabled={isSubmitting}>
              <InputLabel id="feedback-category-label">Тема звернення</InputLabel>
              <Select
                labelId="feedback-category-label"
                value={category}
                label="Тема звернення"
                onChange={(e) => setCategory(e.target.value)}
              >
                {FEEDBACK_CATEGORIES.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Повідомлення"
              name="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              fullWidth
              multiline
              minRows={3}
              disabled={isSubmitting}
              placeholder="Опишіть вашу пропозицію або проблему..."
            />

            <Button
              type="submit"
              variant="outlined"
              color="primary"
              fullWidth
              disabled={isSubmitting}
              sx={{ height: 48, flexShrink: 0, mt: 1 }}
            >
              {isSubmitting ? <LoadingIndicator minHeight={24} /> : "Надіслати"}
            </Button>
          </Box>
        </form>
      </Paper>
    </EntityModal>
  );
};

export default FeedbackModal;
