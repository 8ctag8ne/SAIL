using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class AddSupabaseRLSStrict : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "id",
                keyValue: "13f427c8-4bfd-4ab8-9a83-e2b3f9c53bee");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "id",
                keyValue: "657c372a-15e3-4008-98d7-3e6922472652");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "id",
                keyValue: "95cf1626-8e85-41f3-92e8-6b1499475248");

            migrationBuilder.InsertData(
                table: "AspNetRoles",
                columns: new[] { "id", "concurrency_stamp", "name", "normalized_name" },
                values: new object[,]
                {
                    { "28ce31cc-ab42-49c6-98d6-d74ddfb3b012", null, "Admin", "ADMIN" },
                    { "a96399e8-3c1f-4626-9da2-bf3550a09c34", null, "Librarian", "LIBRARIAN" },
                    { "ea9624f7-b305-40a5-885e-d93786cc4620", null, "User", "USER" }
                });

            // Enable RLS on ASP.NET Identity tables
            migrationBuilder.Sql("ALTER TABLE IF EXISTS \"AspNetUsers\" ENABLE ROW LEVEL SECURITY;");
            migrationBuilder.Sql("ALTER TABLE IF EXISTS \"AspNetRoles\" ENABLE ROW LEVEL SECURITY;");
            migrationBuilder.Sql("ALTER TABLE IF EXISTS \"AspNetUserRoles\" ENABLE ROW LEVEL SECURITY;");
            migrationBuilder.Sql("ALTER TABLE IF EXISTS \"AspNetUserClaims\" ENABLE ROW LEVEL SECURITY;");
            migrationBuilder.Sql("ALTER TABLE IF EXISTS \"AspNetUserLogins\" ENABLE ROW LEVEL SECURITY;");
            migrationBuilder.Sql("ALTER TABLE IF EXISTS \"AspNetUserTokens\" ENABLE ROW LEVEL SECURITY;");
            migrationBuilder.Sql("ALTER TABLE IF EXISTS \"AspNetRoleClaims\" ENABLE ROW LEVEL SECURITY;");

            // Enable RLS on Domain tables
            migrationBuilder.Sql("ALTER TABLE IF EXISTS authors ENABLE ROW LEVEL SECURITY;");
            migrationBuilder.Sql("ALTER TABLE IF EXISTS author_books ENABLE ROW LEVEL SECURITY;");
            migrationBuilder.Sql("ALTER TABLE IF EXISTS books ENABLE ROW LEVEL SECURITY;");
            migrationBuilder.Sql("ALTER TABLE IF EXISTS book_lists ENABLE ROW LEVEL SECURITY;");
            migrationBuilder.Sql("ALTER TABLE IF EXISTS book_list_books ENABLE ROW LEVEL SECURITY;");
            migrationBuilder.Sql("ALTER TABLE IF EXISTS book_markdowns ENABLE ROW LEVEL SECURITY;");
            migrationBuilder.Sql("ALTER TABLE IF EXISTS book_tags ENABLE ROW LEVEL SECURITY;");
            migrationBuilder.Sql("ALTER TABLE IF EXISTS comments ENABLE ROW LEVEL SECURITY;");
            migrationBuilder.Sql("ALTER TABLE IF EXISTS document_chunks ENABLE ROW LEVEL SECURITY;");
            migrationBuilder.Sql("ALTER TABLE IF EXISTS tags ENABLE ROW LEVEL SECURITY;");
            migrationBuilder.Sql("ALTER TABLE IF EXISTS likes ENABLE ROW LEVEL SECURITY;");

            // Enable RLS on EF Core Migration History table
            migrationBuilder.Sql("ALTER TABLE IF EXISTS \"__EFMigrationsHistory\" ENABLE ROW LEVEL SECURITY;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "id",
                keyValue: "28ce31cc-ab42-49c6-98d6-d74ddfb3b012");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "id",
                keyValue: "a96399e8-3c1f-4626-9da2-bf3550a09c34");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "id",
                keyValue: "ea9624f7-b305-40a5-885e-d93786cc4620");

            migrationBuilder.InsertData(
                table: "AspNetRoles",
                columns: new[] { "id", "concurrency_stamp", "name", "normalized_name" },
                values: new object[,]
                {
                    { "13f427c8-4bfd-4ab8-9a83-e2b3f9c53bee", null, "Admin", "ADMIN" },
                    { "657c372a-15e3-4008-98d7-3e6922472652", null, "Librarian", "LIBRARIAN" },
                    { "95cf1626-8e85-41f3-92e8-6b1499475248", null, "User", "USER" }
                });
        }
    }
}
