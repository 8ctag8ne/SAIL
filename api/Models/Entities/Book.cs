//api/Models/Entities/Book.cs
using System.ComponentModel.DataAnnotations.Schema;
using api.Models.Entities;
using Pgvector;
namespace MilLib.Models.Entities
{
    public class Book
    {
        public int Id {get; set;}
        
        public required string Title {get; set;}
        public List<AuthorBook> Authors {get; set;} = new List<AuthorBook>();
        public string? FileUrl {get; set;}
        public string? ImageUrl {get; set;}
        public string? Info {get; set;}
        
        [Column(TypeName = "vector(4096)")] 
        public Vector? Embedding { get; set; }
        public List<DocumentChunk> Chunks {get; set;} = new List<DocumentChunk>();
        public List<BookTag> Tags {get; set;} = new List<BookTag>();
        public List<BookListBook> BookLists {get; set;} = new List<BookListBook>();
        public List<Comment> Comments { get; set; } = new List<Comment>();
        public List<Like> Likes { get; set; } = new List<Like>();
        public int LikesCount {get; set;} = 0;
    }
}