import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { getUserById } from "../api/Account";
import { User } from "../types";
import PageContainer from "../components/layout/PageContainer/PageContainer";
import { Box, Tabs, Tab } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import LoadingIndicator from "../components/ui/LoadingIndicator";
import UserDetails from "../components/user/UserDetails/UserDetails";
import UserLikesView from "../components/user/UserViews/UserLikesView";
import UserBookListsView from "../components/user/UserViews/UserBookListsView";

const UserProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<User | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "likes";

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
        <UserDetails
          user={profile}
          showEdit={true}
          onDeleted={handleDeleted}
          onUpdated={handleUpdated}
        />
      </Box>

      {/* STICKY TABS */}
      <Box
        sx={{
          position: "sticky",
          // xs: 56px for mobile navbar, sm: 64px for desktop navbar
          top: { xs: 56, sm: 64 },
          zIndex: 10,
          bgcolor: "background.default",
          borderBottom: 1,
          borderColor: "divider",
          mb: 2,
          pt: 1,
        }}
      >
        <Tabs
          value={currentTab === "lists" ? 1 : 0}
          onChange={(_, v) => setSearchParams({ tab: v === 1 ? "lists" : "likes" })}
          centered
        >
          <Tab label="Вподобання" />
          <Tab label="Списки книг" />
        </Tabs>
      </Box>

      {/* CONDITIONAL RENDERING */}
      <Box>
        {currentTab === "likes" ? (
          <UserLikesView userId={id!} />
        ) : (
          <UserBookListsView userId={id!} isOwnProfile={!!isOwnProfile} />
        )}
      </Box>
    </PageContainer>
  );
};

export default UserProfilePage;
