import React, { useEffect, useState } from "react";
import { getAllUsers } from "../Api/Account";
import { User } from "../types";
import PageContainer from "../Components/PageContainer/PageContainer";
import UserCard from "../Components/UserCard/UserCard";
import { Typography, Box } from "@mui/material";

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    getAllUsers().then((data) => setUsers(data as User[]));
  }, []);

  return (
    <PageContainer>
      <Typography variant="h4" align="center" sx={{ mb: 3 }}>
        All Users
      </Typography>
      {users.length === 0 ? (
        <Typography align="center" color="text.secondary">
          No users found.
        </Typography>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 3,
            justifyContent: "center",
          }}
        >
          {users.map(user => (
            <Box
              key={user.id}
              sx={{
                flex: "1 1 300px",
                maxWidth: 350,
                minWidth: 250,
              }}
            >
              <UserCard user={user} showEdit />
            </Box>
          ))}
        </Box>
      )}
    </PageContainer>
  );
};

export default UsersPage;