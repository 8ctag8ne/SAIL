//api/Models/Entities/BookListBook.cs
namespace MilLib.Models.Entities
{
    public class BookListBook
    {
        public int? BookId { get; set; }
        public int? BookListId { get; set; }
        
        public Book? Book { get; set; }
        public BookList? BookList { get; set; }
    }
}