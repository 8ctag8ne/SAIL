//api/Models/Entities/BookList.cs
using api.Models.Entities;
namespace MilLib.Models.Entities
{
    public class BookList
    {
        public int Id { get; set; }
        public string? Title { get; set; }
        public string? UserId { get; set; }
        public User? User { get; set; }
        public string? Description { get; set; }
        public bool? IsPrivate {get; set;}
        public List<BookListBook> Books { get; set;} = new List<BookListBook>();
    }
}