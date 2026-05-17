using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class UpdateVectors : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "id",
                keyValue: "46e1c5c9-ca58-4f1d-9926-82eb60dc23e5");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "id",
                keyValue: "82437e89-f719-4bf5-aa9f-ac20e19fa858");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "id",
                keyValue: "bc46f3ef-5c17-4ee9-ac86-18cc47d8b0fd");

            migrationBuilder.InsertData(
                table: "AspNetRoles",
                columns: new[] { "id", "concurrency_stamp", "name", "normalized_name" },
                values: new object[,]
                {
                    { "12be7af7-1964-4d76-b3aa-962d9ed26bbf", null, "Admin", "ADMIN" },
                    { "86746e56-d28f-4a4e-a325-684f394b54f6", null, "Librarian", "LIBRARIAN" },
                    { "ca5e5910-071e-4b1c-9f6f-f0e000431f77", null, "User", "USER" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "id",
                keyValue: "12be7af7-1964-4d76-b3aa-962d9ed26bbf");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "id",
                keyValue: "86746e56-d28f-4a4e-a325-684f394b54f6");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "id",
                keyValue: "ca5e5910-071e-4b1c-9f6f-f0e000431f77");

            migrationBuilder.InsertData(
                table: "AspNetRoles",
                columns: new[] { "id", "concurrency_stamp", "name", "normalized_name" },
                values: new object[,]
                {
                    { "46e1c5c9-ca58-4f1d-9926-82eb60dc23e5", null, "User", "USER" },
                    { "82437e89-f719-4bf5-aa9f-ac20e19fa858", null, "Librarian", "LIBRARIAN" },
                    { "bc46f3ef-5c17-4ee9-ac86-18cc47d8b0fd", null, "Admin", "ADMIN" }
                });
        }
    }
}
