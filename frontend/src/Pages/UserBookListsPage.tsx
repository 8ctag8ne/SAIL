import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { getUserById } from "../api/Account";
import { getBookListsForUser } from "../api/BookListApi";
import { User, BookList } from "../types";
import PageContainer from "../components/layout/PageContainer/PageContainer";
import { Box, Typography, Tabs, Tab } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import CreateBookListButton from "../components/books/BookList/CreateBookListButton";
import BookListCard from "../components/books/BookList/BookListCard";
import LoadingIndicator from "../components/ui/LoadingIndicator";
import UserCard from "../components/user/UserCard/UserCard";

const UserBookListsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<User | null>(null);
  const [bookLists, setBookLists] = useState<BookList[]>([]);
  const [, setSearchParams] = useSearchParams();

  const isOwnProfile = user && profile && user.id === profile.id;

  useEffect(() => {
    if (id) {
      getUserById(id).then((data) => setProfile(data as User));
      getBookListsForUser(id).then(setBookLists);
    }
  }, [id]);

  const handleDeleted = () => {
    if (isOwnProfile) {
      localStorage.removeItem("token");
      window.location.href = "/";
    } else {
      navigate("/users");
    }
  };

  const handleUpdated = () => {
    if (id) {
      getUserById(id).then((data) => setProfile(data as User));
    }
  };

  if (!profile) {
    return (
      <PageContainer>
        <LoadingIndicator />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Box sx={{ mb: 4 }}>
        <UserCard
          user={profile}
          showEdit={true}
          onDeleted={handleDeleted}
          onUpdated={handleUpdated}
        />
      </Box>
      <Tabs value={1} onChange={(_, v) => setSearchParams({ tab: v === 1 ? "lists" : "likes" })} centered sx={{ mb: 2 }}>
        <Tab label="Вподобання" />
        <Tab label="Списки книг" />
      </Tabs>

      <Box>
        {/* Додаємо кнопку створення списку */}
        {isOwnProfile && (
          <Box sx={{ mb: 2 }}>
            <CreateBookListButton onCreated={() => getBookListsForUser(id!).then(setBookLists)} />
          </Box>
        )}
        {bookLists.length === 0 ? (
          <Typography color="text.secondary" align="center">
            Жодних списків книг.
          </Typography>
        ) : (
          bookLists.map((list) => (
            <BookListCard
              key={list.id}
              list={list}
              onDeleted={id => setBookLists(prev => prev.filter(l => l.id !== id))}
              onUpdated={updated => setBookLists(prev => prev.map(l => l.id === updated.id ? updated : l))}
            />
          ))
        )}
      </Box>
    </PageContainer>
  );
};

export default UserBookListsPage;