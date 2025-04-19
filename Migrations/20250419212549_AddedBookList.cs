using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MilLib.Migrations
{
    /// <inheritdoc />
    public partial class AddedBookList : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BookLists",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Title = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsPrivate = table.Column<bool>(type: "bit", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BookLists", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "BookListBooks",
                columns: table => new
                {
                    BookId = table.Column<int>(type: "int", nullable: false),
                    BookListId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BookListBooks", x => new { x.BookId, x.BookListId });
                    table.ForeignKey(
                        name: "FK_BookListBooks_BookLists_BookListId",
                        column: x => x.BookListId,
                        principalTable: "BookLists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BookListBooks_Books_BookId",
                        column: x => x.BookId,
                        principalTable: "Books",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BookListBooks_BookListId",
                table: "BookListBooks",
                column: "BookListId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BookListBooks");

            migrationBuilder.DropTable(
                name: "BookLists");
        }
    }
}
