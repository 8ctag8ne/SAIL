using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class FixNullablePages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "page_start",
                table: "document_chunks",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<int>(
                name: "page_end",
                table: "document_chunks",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

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
                    { "13f427c8-4bfd-4ab8-9a83-e2b3f9c53bee", null, "Admin", "ADMIN" },
                    { "657c372a-15e3-4008-98d7-3e6922472652", null, "Librarian", "LIBRARIAN" },
                    { "95cf1626-8e85-41f3-92e8-6b1499475248", null, "User", "USER" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "page_start",
                table: "document_chunks",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "page_end",
                table: "document_chunks",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);
                
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
                    { "2f49d79d-717a-4f49-9118-fce9a56c5cf5", null, "Librarian", "LIBRARIAN" },
                    { "a9b86844-6d3c-46ef-b349-f3989147bef5", null, "Admin", "ADMIN" },
                    { "ca9f3809-f3b9-4181-a2f1-f50594950a69", null, "User", "USER" }
                });
        }
    }
}
