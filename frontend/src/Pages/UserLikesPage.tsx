import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { getUserById } from "../api/Account";
import { useLikedBooks } from "../hooks/useLikedBooks";
import { User } from "../types";
import PageContainer from "../components/layout/PageContainer/PageContainer";
import BookCard from "../components/books/BookCard/BookCard";
import { Box, Typography, Tabs, Tab } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import LoadingIndicator from "../components/ui/LoadingIndicator";
import UserCard from "../components/user/UserCard/UserCard";

const UserLikesPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<User | null>(null);
  const { data: likedBooks = [] } = useLikedBooks(id);
  const [, setSearchParams] = useSearchParams();

  const isOwnProfile = user && profile && user.id === profile.id;

  useEffect(() => {
    if (id) {
      getUserById(id).then((data) => setProfile(data as User));
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
      <Tabs value={0} onChange={(_, v) => setSearchParams({ tab: v === 1 ? "lists" : "likes" })} centered sx={{ mb: 2 }}>
        <Tab label="Вподобання" />
        <Tab label="Списки книг" />
      </Tabs>
      <Box>
        {likedBooks.length === 0 ? (
          <Typography color="text.secondary" align="center">
            Жодних уподобаних книг.
          </Typography>
        ) : (
          likedBooks.map((book) => <BookCard key={book.id} {...book} tags={book.tags} />)
        )}
      </Box>
    </PageContainer>
  );
};

export default UserLikesPage;