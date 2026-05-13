using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class AddBookMarkdownAndStates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
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

            migrationBuilder.AddColumn<bool>(
                name: "parsed",
                table: "books",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "processed",
                table: "books",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "book_markdowns",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    book_id = table.Column<int>(type: "integer", nullable: false),
                    content = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_book_markdowns", x => x.id);
                    table.ForeignKey(
                        name: "fk_book_markdowns_books_book_id",
                        column: x => x.book_id,
                        principalTable: "books",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "AspNetRoles",
                columns: new[] { "id", "concurrency_stamp", "name", "normalized_name" },
                values: new object[,]
                {
                    { "46e1c5c9-ca58-4f1d-9926-82eb60dc23e5", null, "User", "USER" },
                    { "82437e89-f719-4bf5-aa9f-ac20e19fa858", null, "Librarian", "LIBRARIAN" },
                    { "bc46f3ef-5c17-4ee9-ac86-18cc47d8b0fd", null, "Admin", "ADMIN" }
                });

            migrationBuilder.CreateIndex(
                name: "ix_book_markdowns_book_id",
                table: "book_markdowns",
                column: "book_id",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "book_markdowns");

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

            migrationBuilder.DropColumn(
                name: "parsed",
                table: "books");

            migrationBuilder.DropColumn(
                name: "processed",
                table: "books");

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
    }
}
