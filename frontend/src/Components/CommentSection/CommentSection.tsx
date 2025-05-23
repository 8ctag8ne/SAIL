import React, { useState } from "react";
import { Box, Typography, Card, CardContent, Button, TextField, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCommentIcon from "@mui/icons-material/AddComment";
import { Comment } from "../../types";
import { useAuth } from "../../Contexts/AuthContext";
import { addComment, updateComment, deleteComment } from "../../Api/CommentApi";
import { useNavigate } from "react-router-dom";

type CommentSectionProps = {
    comments: Comment[];
    bookId?: number;
    onCommentAdded?: (comment: Comment) => void;
    onCommentUpdated?: (comment: Comment) => void;
    onCommentDeleted?: (id: number) => void;
};

const CommentSection: React.FC<CommentSectionProps> = ({
    comments,
    bookId,
    onCommentAdded,
    onCommentUpdated,
    onCommentDeleted,
}) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [newComment, setNewComment] = useState("");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingContent, setEditingContent] = useState("");
    const [deleteDialogId, setDeleteDialogId] = useState<number | null>(null);
    const [localComments, setLocalComments] = useState<Comment[]>(comments);

    // Оновлювати локальні коментарі при зміні пропса
    React.useEffect(() => {
        setLocalComments(comments);
    }, [comments]);

    const canEditOrDelete = (comment: Comment) =>
        user &&
        (user.username === comment.userName ||
            user.roles.includes("Admin") ||
            user.roles.includes("Librarian"));

    const handleAddComment = async () => {
        if (!user || !bookId || !newComment.trim()) return;
        const comment = await addComment({ bookId, content: newComment.trim() });
        setNewComment("");
        setLocalComments(prev => [comment, ...prev]);
        onCommentAdded?.(comment);
    };

    const handleEditComment = async (id: number) => {
        if (!editingContent.trim()) return;
        const updated = await updateComment(id, { content: editingContent.trim() });
        setEditingId(null);
        setEditingContent("");
        setLocalComments(prev =>
            prev.map(c => (c.id === id ? { ...c, content: updated.content } : c))
        );
        onCommentUpdated?.(updated);
    };

    const handleDeleteComment = async (id: number) => {
        await deleteComment(id);
        setDeleteDialogId(null);
        setLocalComments(prev => prev.filter(c => c.id !== id));
        onCommentDeleted?.(id);
    };

    // Сортуємо коментарі: новіші вгорі
    const sortedComments = [...localComments].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return (
        <Box>
            <Typography variant="h5" gutterBottom>
                Comments
            </Typography>
            {user && bookId && (
                <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                    <TextField
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Add a comment..."
                        size="small"
                        fullWidth
                        multiline
                        minRows={1}
                        maxRows={4}
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddCommentIcon />}
                        onClick={handleAddComment}
                        disabled={!newComment.trim()}
                    >
                        Add
                    </Button>
                </Box>
            )}
            {sortedComments.length > 0 ? (
                sortedComments.map((comment) => (
                    <Card
                        key={comment.id}
                        sx={{
                            marginBottom: 2,
                            boxShadow: 3,
                            padding: 1,
                            position: "relative",
                        }}
                    >
                        <CardContent>
                            <Typography
                                variant="subtitle2"
                                color="text.primary"
                                sx={{ cursor: "pointer", textDecoration: "underline", display: "inline-block" }}
                                onClick={() => navigate(`/users/${comment.userId}`)}
                            >
                                {comment.userName || "User"}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {new Date(comment.createdAt).toLocaleString()}
                            </Typography>
                            {editingId === comment.id ? (
                                <Box sx={{ mt: 1 }}>
                                    <TextField
                                        value={editingContent}
                                        onChange={(e) => setEditingContent(e.target.value)}
                                        fullWidth
                                        multiline
                                        minRows={1}
                                        maxRows={4}
                                    />
                                    <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            size="small"
                                            onClick={() => handleEditComment(comment.id)}
                                            disabled={!editingContent.trim()}
                                        >
                                            Save
                                        </Button>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            onClick={() => {
                                                setEditingId(null);
                                                setEditingContent("");
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </Box>
                                </Box>
                            ) : (
                                <Typography variant="body1" sx={{ marginTop: 1 }}>
                                    {comment.content}
                                </Typography>
                            )}
                        </CardContent>
                        {canEditOrDelete(comment) && editingId !== comment.id && (
                            <Box sx={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 1 }}>
                                <IconButton
                                    color="primary"
                                    onClick={() => {
                                        setEditingId(comment.id);
                                        setEditingContent(comment.content);
                                    }}
                                    size="small"
                                >
                                    <EditIcon />
                                </IconButton>
                                <IconButton
                                    color="error"
                                    onClick={() => setDeleteDialogId(comment.id)}
                                    size="small"
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </Box>
                        )}
                    </Card>
                ))
            ) : (
                <Typography variant="body2" color="text.secondary">
                    No comments yet.
                </Typography>
            )}
            {/* Delete confirmation dialog */}
            <Dialog
                open={!!deleteDialogId}
                onClose={() => setDeleteDialogId(null)}
            >
                <DialogTitle>Delete Comment</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to delete this comment?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogId(null)}>Cancel</Button>
                    <Button
                        color="error"
                        onClick={() => deleteDialogId && handleDeleteComment(deleteDialogId)}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CommentSection;