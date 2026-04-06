using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Pgvector;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class FixedSchemaWithVector : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_author_book_author_author_id",
                table: "author_book");

            migrationBuilder.DropForeignKey(
                name: "fk_author_book_book_book_id",
                table: "author_book");

            migrationBuilder.DropForeignKey(
                name: "fk_book_list_user_user_id",
                table: "book_list");

            migrationBuilder.DropForeignKey(
                name: "fk_book_list_book_book_book_id",
                table: "book_list_book");

            migrationBuilder.DropForeignKey(
                name: "fk_book_list_book_book_list_book_list_id",
                table: "book_list_book");

            migrationBuilder.DropForeignKey(
                name: "fk_book_tag_book_book_id",
                table: "book_tag");

            migrationBuilder.DropForeignKey(
                name: "fk_book_tag_tag_tag_id",
                table: "book_tag");

            migrationBuilder.DropForeignKey(
                name: "fk_comment_book_book_id",
                table: "comment");

            migrationBuilder.DropForeignKey(
                name: "fk_comment_comment_reply_to_id",
                table: "comment");

            migrationBuilder.DropForeignKey(
                name: "fk_comment_user_user_id",
                table: "comment");

            migrationBuilder.DropForeignKey(
                name: "fk_like_book_book_id",
                table: "like");

            migrationBuilder.DropForeignKey(
                name: "fk_like_user_user_id",
                table: "like");

            migrationBuilder.DropPrimaryKey(
                name: "pk_tag",
                table: "tag");

            migrationBuilder.DropPrimaryKey(
                name: "pk_like",
                table: "like");

            migrationBuilder.DropPrimaryKey(
                name: "pk_comment",
                table: "comment");

            migrationBuilder.DropPrimaryKey(
                name: "pk_book_tag",
                table: "book_tag");

            migrationBuilder.DropPrimaryKey(
                name: "pk_book_list_book",
                table: "book_list_book");

            migrationBuilder.DropPrimaryKey(
                name: "pk_book_list",
                table: "book_list");

            migrationBuilder.DropPrimaryKey(
                name: "pk_book",
                table: "book");

            migrationBuilder.DropPrimaryKey(
                name: "pk_author_book",
                table: "author_book");

            migrationBuilder.DropPrimaryKey(
                name: "pk_author",
                table: "author");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "id",
                keyValue: "402a1338-7240-4e39-b928-1b44db8fda96");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "id",
                keyValue: "a7340459-b0dd-4c73-93fd-bb212f183136");

            migrationBuilder.DeleteData(
                table: "AspNetRoles",
                keyColumn: "id",
                keyValue: "d48c3af6-8a3d-41c6-b3b3-82b55e6301e6");

            migrationBuilder.RenameTable(
                name: "tag",
                newName: "tags");

            migrationBuilder.RenameTable(
                name: "like",
                newName: "likes");

            migrationBuilder.RenameTable(
                name: "comment",
                newName: "comments");

            migrationBuilder.RenameTable(
                name: "book_tag",
                newName: "book_tags");

            migrationBuilder.RenameTable(
                name: "book_list_book",
                newName: "book_list_books");

            migrationBuilder.RenameTable(
                name: "book_list",
                newName: "book_lists");

            migrationBuilder.RenameTable(
                name: "book",
                newName: "books");

            migrationBuilder.RenameTable(
                name: "author_book",
                newName: "author_books");

            migrationBuilder.RenameTable(
                name: "author",
                newName: "authors");

            migrationBuilder.RenameIndex(
                name: "ix_like_user_id",
                table: "likes",
                newName: "ix_likes_user_id");

            migrationBuilder.RenameIndex(
                name: "ix_comment_user_id",
                table: "comments",
                newName: "ix_comments_user_id");

            migrationBuilder.RenameIndex(
                name: "ix_comment_reply_to_id",
                table: "comments",
                newName: "ix_comments_reply_to_id");

            migrationBuilder.RenameIndex(
                name: "ix_comment_book_id",
                table: "comments",
                newName: "ix_comments_book_id");

            migrationBuilder.RenameIndex(
                name: "ix_book_tag_tag_id",
                table: "book_tags",
                newName: "ix_book_tags_tag_id");

            migrationBuilder.RenameIndex(
                name: "ix_book_list_book_book_list_id",
                table: "book_list_books",
                newName: "ix_book_list_books_book_list_id");

            migrationBuilder.RenameIndex(
                name: "ix_book_list_user_id",
                table: "book_lists",
                newName: "ix_book_lists_user_id");

            migrationBuilder.RenameIndex(
                name: "ix_author_book_author_id",
                table: "author_books",
                newName: "ix_author_books_author_id");

            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:PostgresExtension:vector", ",,");

            migrationBuilder.AddColumn<Vector>(
                name: "embedding",
                table: "books",
                type: "vector(4096)",
                nullable: true);

            migrationBuilder.AddPrimaryKey(
                name: "pk_tags",
                table: "tags",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "pk_likes",
                table: "likes",
                columns: new[] { "book_id", "user_id" });

            migrationBuilder.AddPrimaryKey(
                name: "pk_comments",
                table: "comments",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "pk_book_tags",
                table: "book_tags",
                columns: new[] { "book_id", "tag_id" });

            migrationBuilder.AddPrimaryKey(
                name: "pk_book_list_books",
                table: "book_list_books",
                columns: new[] { "book_id", "book_list_id" });

            migrationBuilder.AddPrimaryKey(
                name: "pk_book_lists",
                table: "book_lists",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "pk_books",
                table: "books",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "pk_author_books",
                table: "author_books",
                columns: new[] { "book_id", "author_id" });

            migrationBuilder.AddPrimaryKey(
                name: "pk_authors",
                table: "authors",
                column: "id");

            migrationBuilder.CreateTable(
                name: "document_chunks",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    book_id = table.Column<int>(type: "integer", nullable: false),
                    level = table.Column<int>(type: "integer", nullable: false),
                    parent_id = table.Column<Guid>(type: "uuid", nullable: true),
                    page_number = table.Column<int>(type: "integer", nullable: false),
                    text = table.Column<string>(type: "text", nullable: false),
                    embedding = table.Column<Vector>(type: "vector(4096)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_document_chunks", x => x.id);
                    table.ForeignKey(
                        name: "fk_document_chunks_books_book_id",
                        column: x => x.book_id,
                        principalTable: "books",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_document_chunks_document_chunks_parent_id",
                        column: x => x.parent_id,
                        principalTable: "document_chunks",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "AspNetRoles",
                columns: new[] { "id", "concurrency_stamp", "name", "normalized_name" },
                values: new object[,]
                {
                    { "d3e8117c-94cf-41eb-a818-8539540f7fb7", null, "Librarian", "LIBRARIAN" },
                    { "ed06ccca-20c3-40de-8112-207092456080", null, "User", "USER" },
                    { "eebf809e-4508-40cd-9c69-1ba1456d01c7", null, "Admin", "ADMIN" }
                });

            migrationBuilder.CreateIndex(
                name: "ix_document_chunks_book_id",
                table: "document_chunks",
                column: "book_id");

            migrationBuilder.CreateIndex(
                name: "ix_document_chunks_parent_id",
                table: "document_chunks",
                column: "parent_id");

            migrationBuilder.AddForeignKey(
                name: "fk_author_books_authors_author_id",
                table: "author_books",
                column: "author_id",
                principalTable: "authors",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_author_books_books_book_id",
                table: "author_books",
                column: "book_id",
                principalTable: "books",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_book_list_books_book_lists_book_list_id",
                table: "book_list_books",
                column: "book_list_id",
                principalTable: "book_lists",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_book_list_books_books_book_id",
                table: "book_list_books",
                column: "book_id",
                principalTable: "books",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_book_lists_users_user_id",
                table: "book_lists",
                column: "user_id",
                principalTable: "AspNetUsers",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_book_tags_books_book_id",
                table: "book_tags",
                column: "book_id",
                principalTable: "books",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_book_tags_tags_tag_id",
                table: "book_tags",
                column: "tag_id",
                principalTable: "tags",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_comments_books_book_id",
                table: "comments",
                column: "book_id",
                principalTable: "books",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_comments_comments_reply_to_id",
                table: "comments",
                column: "reply_to_id",
                principalTable: "comments",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "fk_comments_users_user_id",
                table: "comments",
                column: "user_id",
                principalTable: "AspNetUsers",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_likes_books_book_id",
                table: "likes",
                column: "book_id",
                principalTable: "books",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_likes_users_user_id",
                table: "likes",
                column: "user_id",
                principalTable: "AspNetUsers",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "fk_author_books_authors_author_id",
                table: "author_books");

            migrationBuilder.DropForeignKey(
                name: "fk_author_books_books_book_id",
                table: "author_books");

            migrationBuilder.DropForeignKey(
                name: "fk_book_list_books_book_lists_book_list_id",
                table: "book_list_books");

            migrationBuilder.DropForeignKey(
                name: "fk_book_list_books_books_book_id",
                table: "book_list_books");

            migrationBuilder.DropForeignKey(
                name: "fk_book_lists_users_user_id",
                table: "book_lists");

            migrationBuilder.DropForeignKey(
                name: "fk_book_tags_books_book_id",
                table: "book_tags");

            migrationBuilder.DropForeignKey(
                name: "fk_book_tags_tags_tag_id",
                table: "book_tags");

            migrationBuilder.DropForeignKey(
                name: "fk_comments_books_book_id",
                table: "comments");

            migrationBuilder.DropForeignKey(
                name: "fk_comments_comments_reply_to_id",
                table: "comments");

            migrationBuilder.DropForeignKey(
                name: "fk_comments_users_user_id",
                table: "comments");

            migrationBuilder.DropForeignKey(
                name: "fk_likes_books_book_id",
                table: "likes");

            migrationBuilder.DropForeignKey(
                name: "fk_likes_users_user_id",
                table: "likes");

            migrationBuilder.DropTable(
                name: "document_chunks");

            migrationBuilder.DropPrimaryKey(
                name: "pk_tags",
                table: "tags");

            migrationBuilder.DropPrimaryKey(
                name: "pk_likes",
                table: "likes");

            migrationBuilder.DropPrimaryKey(
                name: "pk_comments",
                table: "comments");

            migrationBuilder.DropPrimaryKey(
                name: "pk_books",
                table: "books");

            migrationBuilder.DropPrimaryKey(
                name: "pk_book_tags",
                table: "book_tags");

            migrationBuilder.DropPrimaryKey(
                name: "pk_book_lists",
                table: "book_lists");

            migrationBuilder.DropPrimaryKey(
                name: "pk_book_list_books",
                table: "book_list_books");

            migrationBuilder.DropPrimaryKey(
                name: "pk_authors",
                table: "authors");

            migrationBuilder.DropPrimaryKey(
                name: "pk_author_books",
                table: "author_books");

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

            migrationBuilder.DropColumn(
                name: "embedding",
                table: "books");

            migrationBuilder.RenameTable(
                name: "tags",
                newName: "tag");

            migrationBuilder.RenameTable(
                name: "likes",
                newName: "like");

            migrationBuilder.RenameTable(
                name: "comments",
                newName: "comment");

            migrationBuilder.RenameTable(
                name: "books",
                newName: "book");

            migrationBuilder.RenameTable(
                name: "book_tags",
                newName: "book_tag");

            migrationBuilder.RenameTable(
                name: "book_lists",
                newName: "book_list");

            migrationBuilder.RenameTable(
                name: "book_list_books",
                newName: "book_list_book");

            migrationBuilder.RenameTable(
                name: "authors",
                newName: "author");

            migrationBuilder.RenameTable(
                name: "author_books",
                newName: "author_book");

            migrationBuilder.RenameIndex(
                name: "ix_likes_user_id",
                table: "like",
                newName: "ix_like_user_id");

            migrationBuilder.RenameIndex(
                name: "ix_comments_user_id",
                table: "comment",
                newName: "ix_comment_user_id");

            migrationBuilder.RenameIndex(
                name: "ix_comments_reply_to_id",
                table: "comment",
                newName: "ix_comment_reply_to_id");

            migrationBuilder.RenameIndex(
                name: "ix_comments_book_id",
                table: "comment",
                newName: "ix_comment_book_id");

            migrationBuilder.RenameIndex(
                name: "ix_book_tags_tag_id",
                table: "book_tag",
                newName: "ix_book_tag_tag_id");

            migrationBuilder.RenameIndex(
                name: "ix_book_lists_user_id",
                table: "book_list",
                newName: "ix_book_list_user_id");

            migrationBuilder.RenameIndex(
                name: "ix_book_list_books_book_list_id",
                table: "book_list_book",
                newName: "ix_book_list_book_book_list_id");

            migrationBuilder.RenameIndex(
                name: "ix_author_books_author_id",
                table: "author_book",
                newName: "ix_author_book_author_id");

            migrationBuilder.AlterDatabase()
                .OldAnnotation("Npgsql:PostgresExtension:vector", ",,");

            migrationBuilder.AddPrimaryKey(
                name: "pk_tag",
                table: "tag",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "pk_like",
                table: "like",
                columns: new[] { "book_id", "user_id" });

            migrationBuilder.AddPrimaryKey(
                name: "pk_comment",
                table: "comment",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "pk_book",
                table: "book",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "pk_book_tag",
                table: "book_tag",
                columns: new[] { "book_id", "tag_id" });

            migrationBuilder.AddPrimaryKey(
                name: "pk_book_list",
                table: "book_list",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "pk_book_list_book",
                table: "book_list_book",
                columns: new[] { "book_id", "book_list_id" });

            migrationBuilder.AddPrimaryKey(
                name: "pk_author",
                table: "author",
                column: "id");

            migrationBuilder.AddPrimaryKey(
                name: "pk_author_book",
                table: "author_book",
                columns: new[] { "book_id", "author_id" });

            migrationBuilder.InsertData(
                table: "AspNetRoles",
                columns: new[] { "id", "concurrency_stamp", "name", "normalized_name" },
                values: new object[,]
                {
                    { "402a1338-7240-4e39-b928-1b44db8fda96", null, "Admin", "ADMIN" },
                    { "a7340459-b0dd-4c73-93fd-bb212f183136", null, "Librarian", "LIBRARIAN" },
                    { "d48c3af6-8a3d-41c6-b3b3-82b55e6301e6", null, "User", "USER" }
                });

            migrationBuilder.AddForeignKey(
                name: "fk_author_book_author_author_id",
                table: "author_book",
                column: "author_id",
                principalTable: "author",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_author_book_book_book_id",
                table: "author_book",
                column: "book_id",
                principalTable: "book",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_book_list_user_user_id",
                table: "book_list",
                column: "user_id",
                principalTable: "AspNetUsers",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_book_list_book_book_book_id",
                table: "book_list_book",
                column: "book_id",
                principalTable: "book",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_book_list_book_book_list_book_list_id",
                table: "book_list_book",
                column: "book_list_id",
                principalTable: "book_list",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_book_tag_book_book_id",
                table: "book_tag",
                column: "book_id",
                principalTable: "book",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_book_tag_tag_tag_id",
                table: "book_tag",
                column: "tag_id",
                principalTable: "tag",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_comment_book_book_id",
                table: "comment",
                column: "book_id",
                principalTable: "book",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_comment_comment_reply_to_id",
                table: "comment",
                column: "reply_to_id",
                principalTable: "comment",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "fk_comment_user_user_id",
                table: "comment",
                column: "user_id",
                principalTable: "AspNetUsers",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_like_book_book_id",
                table: "like",
                column: "book_id",
                principalTable: "book",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "fk_like_user_user_id",
                table: "like",
                column: "user_id",
                principalTable: "AspNetUsers",
                principalColumn: "id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
