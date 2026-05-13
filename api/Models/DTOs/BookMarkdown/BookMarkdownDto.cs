//api/Models/DTOs/BookMarkdown/BookMarkdownDto.cs
namespace MilLib.Models.DTOs.BookMarkdown
{
    public class BookMarkdownDto
    {
        public int Id { get; set; }
        public int BookId { get; set; }
        public string Content { get; set; } = string.Empty;
    }
}
