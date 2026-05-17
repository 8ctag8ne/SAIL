using Microsoft.EntityFrameworkCore.Migrations;
using Pgvector; // Не забудь додати цей using для типу Vector

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class AlterVectors2560 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Твої ручні зміни для pgvector
            migrationBuilder.AlterColumn<Vector>(
                name: "embedding",
                table: "books",
                type: "vector(2560)",
                nullable: true,
                oldClrType: typeof(Vector),
                oldType: "vector(4096)",
                oldNullable: true);

            migrationBuilder.AlterColumn<Vector>(
                name: "embedding",
                table: "document_chunks",
                type: "vector(2560)",
                nullable: true,
                oldClrType: typeof(Vector),
                oldType: "vector(2048)",
                oldNullable: true);

            // 2. Згенеровані EF зміни для ролей
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
                    { "2f49d79d-717a-4f49-9118-fce9a56c5cf5", null, "Librarian", "LIBRARIAN" },
                    { "a9b86844-6d3c-46ef-b349-f3989147bef5", null, "Admin", "ADMIN" },
                    { "ca9f3809-f3b9-4181-a2f1-f50594950a69", null, "User", "USER" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // 1. Твої ручні зміни для pgvector (відкат)
            migrationBuilder.AlterColumn<Vector>(
                name: "embedding",
                table: "books",
                type: "vector(4096)",
                nullable: true,
                oldClrType: typeof(Vector),
                oldType: "vector(2560)",
                oldNullable: true);

            migrationBuilder.AlterColumn<Vector>(
                name: "embedding",
                table: "document_chunks",
                type: "vector(2048)",
                nullable: true,
                oldClrType: typeof(Vector),
                oldType: "vector(2560)",
                oldNullable: true);

            // 2. Згенеровані EF зміни для ролей (відкат)
            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "id",
                keyValue: "2f49d79d-717a-4f49-9118-fce9a56c5cf5");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "id",
                keyValue: "a9b86844-6d3c-46ef-b349-f3989147bef5");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "id",
                keyValue: "ca9f3809-f3b9-4181-a2f1-f50594950a69");

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
    }
}