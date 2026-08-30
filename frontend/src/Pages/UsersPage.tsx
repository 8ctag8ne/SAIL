import React, { useEffect, useState, useCallback } from "react";
import { getAllUsers, getBannedUsers } from "../api/Account";
import { User } from "../types";
import PageContainer from "../components/layout/PageContainer/PageContainer";
import UserCard from "../components/user/UserCard/UserCard";
import { Typography, Box, Tabs, Tab, TextField, InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useAuth } from "../contexts/AuthContext";
import { useTour } from "../contexts/TourContext";
import LoadingIndicator from "../components/ui/LoadingIndicator";

const UsersPage: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [bannedUsers, setBannedUsers] = useState<User[]>([]);
  const [tabIndex, setTabIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    if (!user || !user.roles.includes("Admin")) return;
    setLoading(true);
    try {
      const [allData, bannedData] = await Promise.all([
        getAllUsers(),
        getBannedUsers()
      ]);
      setUsers(allData as User[]);
      setBannedUsers(bannedData as User[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const { run, activeTour, stepIndex, setStepIndex } = useTour();

  useEffect(() => {
    if (run && activeTour === "admin_users") {
      const isMobileTour = window.innerWidth < 1200;
      if (isMobileTour && stepIndex === 1) {
        setStepIndex(2);
      } else if (!isMobileTour && stepIndex === 0) {
        setStepIndex(1);
      }
    }
  }, [run, activeTour, stepIndex, setStepIndex]);

  if (!user || !user.roles.includes("Admin")) {
    return (
      <PageContainer>
        <Typography align="center" color="text.secondary">
          Доступ заборонено
        </Typography>
      </PageContainer>
    );
  }

  const activeList = tabIndex === 0 ? users : bannedUsers;
  const filteredUsers = activeList.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.userName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.banReason && u.banReason.toLowerCase().includes(q))
    );
  });

  return (
    <PageContainer>
      {/* TABS & SEARCH BAR */}
      <Box sx={{ mb: 3 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "stretch", md: "center" },
            justifyContent: "space-between",
            gap: 2,
            borderBottom: 1,
            borderColor: "divider",
            pb: 1,
          }}
        >
          <Tabs
            value={tabIndex}
            onChange={(_, val) => setTabIndex(val)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              "& .MuiTab-root": {
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: "bold",
                minHeight: 48,
              },
            }}
          >
            <Tab label={`Всі користувачі (${users.length})`} />
            <Tab
              label={`Заблоковані (${bannedUsers.length})`}
              sx={{ color: bannedUsers.length > 0 ? "error.main" : undefined }}
            />
          </Tabs>

          <TextField
            size="small"
            placeholder="Пошук користувача..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
                </InputAdornment>
              ),
              disableUnderline: true,
            }}
            variant="filled"
            sx={{
              minWidth: { xs: "100%", md: 280 },
              "& .MuiFilledInput-root": {
                borderRadius: 0,
              },
            }}
          />
        </Box>
      </Box>

      {loading ? (
        <LoadingIndicator />
      ) : filteredUsers.length === 0 ? (
        <Typography align="center" color="text.secondary" sx={{ py: 4, fontFamily: "'JetBrains Mono', monospace" }}>
          {tabIndex === 1
            ? "Заблокованих користувачів немає."
            : searchQuery
            ? "Користувачів за даним запитом не знайдено."
            : "Нічого не знайдено."}
        </Typography>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1,
            justifyContent: "center",
          }}
        >
          {filteredUsers.map((item, index) => (
            <Box
              key={item.id}
              sx={{
                flex: "1 1 300px",
                maxWidth: 350,
                minWidth: 250,
              }}
            >
              <UserCard
                user={item}
                showEdit
                isFirst={index === 0}
                onDeleted={fetchUsers}
                onUpdated={fetchUsers}
              />
            </Box>
          ))}
        </Box>
      )}
    </PageContainer>
  );
};

export default UsersPage;