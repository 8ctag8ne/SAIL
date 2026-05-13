//api/Models/Entities/BookMarkdown.cs
namespace MilLib.Models.Entities
{
    public class BookMarkdown
    {
        public int Id { get; set; }
        public int BookId { get; set; }
        public string Content { get; set; } = string.Empty;
        
        public Book? Book { get; set; }
    }
}
