using Microsoft.EntityFrameworkCore.Migrations;
using Pgvector;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class VectorSchemaUpdate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "id",
                keyValue: "d3e8117c-94cf-41eb-a818-8539540f7fb7");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "id",
                keyValue: "ed06ccca-20c3-40de-8112-207092456080");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "id",
                keyValue: "eebf809e-4508-40cd-9c69-1ba1456d01c7");

            migrationBuilder.RenameColumn(
                name: "page_number",
                table: "document_chunks",
                newName: "page_start");

            migrationBuilder.AlterColumn<Vector>(
                name: "embedding",
                table: "document_chunks",
                type: "vector(2048)",
                nullable: true,
                oldClrType: typeof(Vector),
                oldType: "vector(4096)",
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "page_end",
                table: "document_chunks",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.InsertData(
                table: "AspNetRoles",
                columns: new[] { "id", "concurrency_stamp", "name", "normalized_name" },
                values: new object[,]
                {
                    { "051175d7-28ea-4875-b47c-a96d4390bc24", null, "Admin", "ADMIN" },
                    { "7d2be235-b0d5-4100-b5b1-df4c7799d92f", null, "Librarian", "LIBRARIAN" },
                    { "7f756616-709f-445e-a47c-2feba4e75d96", null, "User", "USER" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "id",
                keyValue: "051175d7-28ea-4875-b47c-a96d4390bc24");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "id",
                keyValue: "7d2be235-b0d5-4100-b5b1-df4c7799d92f");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "id",
                keyValue: "7f756616-709f-445e-a47c-2feba4e75d96");

            migrationBuilder.DropColumn(
                name: "page_end",
                table: "document_chunks");

            migrationBuilder.RenameColumn(
                name: "page_start",
                table: "document_chunks",
                newName: "page_number");

            migrationBuilder.AlterColumn<Vector>(
                name: "embedding",
                table: "document_chunks",
                type: "vector(4096)",
                nullable: true,
                oldClrType: typeof(Vector),
                oldType: "vector(2048)",
                oldNullable: true);

            migrationBuilder.InsertData(
                table: "AspNetRoles",
                columns: new[] { "id", "concurrency_stamp", "name", "normalized_name" },
                values: new object[,]
                {
                    { "d3e8117c-94cf-41eb-a818-8539540f7fb7", null, "Librarian", "LIBRARIAN" },
                    { "ed06ccca-20c3-40de-8112-207092456080", null, "User", "USER" },
                    { "eebf809e-4508-40cd-9c69-1ba1456d01c7", null, "Admin", "ADMIN" }
                });
        }
    }
}
