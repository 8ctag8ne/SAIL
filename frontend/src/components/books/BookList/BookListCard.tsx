import React, { useState } from "react";
import { Card, CardContent, Typography, Box, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LockIcon from "@mui/icons-material/Lock";
import { BookList, BookListCreate } from "../../../types";
import { useAuth } from "../../../contexts/AuthContext";
import { updateBookList, deleteBookList } from "../../../api/BookListApi";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../../ui/ConfirmDialog";
import EntityModal from "../../ui/EntityModal/EntityModal";
import BookListForm from "./BookListForm";
import { toast } from "react-fox-toast";
import EntityActionMenu, { ActionItem } from "../../ui/EntityActionMenu";

type BookListCardProps = {
  list: BookList;
  onDeleted?: (id: number) => void;
  onUpdated?: (list: BookList) => void;
};

const BookListCard: React.FC<BookListCardProps> = ({ list, onDeleted, onUpdated }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isOwner = user?.id === list.userId

  const [editing, setEditing] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const handleSave = async (data: BookListCreate) => {
    const updated = await updateBookList(list.id, data);
    setEditing(false);
    onUpdated?.(updated);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    try {
      e.stopPropagation();
      await deleteBookList(list.id);
      toast.success("Список успішно видалений!", {
        isCloseBtn: true,
      });
      onDeleted?.(list.id);
    } catch (error) {
      toast.error("Не вдалося видалити список.", {
        isCloseBtn: true,
      });
    } finally {
      setIsDeleteConfirmOpen(false);
    }
  };

  const menuActions: ActionItem[] = [];

  if (isOwner) {
    menuActions.push({
      label: "Редагувати",
      icon: <EditIcon />,
      onClick: () => setEditing(true),
    });
    menuActions.push({
      label: "Видалити",
      icon: <DeleteIcon />,
      onClick: () => setIsDeleteConfirmOpen(true),
      isDestructive: true,
    });
  }

  return (
    <>
      <Card
        sx={{
          my: 2,
          position: "relative",
          cursor: "pointer",
          border: "1px solid #2d2f33",
          borderRadius: 0,
          boxShadow: "none",
        }}
        className="MuiCard-interactive"
        onClick={() => navigate(`/booklists/${list.id}`)}>
        <CardContent sx={{ position: "relative", pb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="h6" fontWeight="bold">
              {list.title}
            </Typography>
            {list.isPrivate && <LockIcon fontSize="small" color="action" />}
            {menuActions.length > 0 && (
              <Box sx={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 1 }}>
                <EntityActionMenu actions={menuActions} />
              </Box>
            )}
          </Box>
          {list.description ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {list.description}
            </Typography>
          ) : null}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Книги: {list.books.map(b => b.title).join(", ")}
          </Typography>
        </CardContent>

        <ConfirmDialog
          open={isDeleteConfirmOpen}
          title="Ви впевнені, що хочете видалити цей список?"
          onConfirm={handleConfirmDelete}
          onCancel={() => setIsDeleteConfirmOpen(false)}
        />
      </Card>

      <EntityModal open={editing} onClose={() => setEditing(false)}>
        <BookListForm
          initialData={list}
          onSubmit={handleSave}
          onClose={() => setEditing(false)}
        />
      </EntityModal>
    </>
  );
};

export default BookListCard;