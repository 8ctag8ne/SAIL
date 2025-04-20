using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MilLib.Models.Entities
{
    public class Comment
    {
        public int Id { get; set; }
        // public string? CreatedBy { get; set; }
        // public User User {get; set;}
        public int BookId { get; set; }
        public Book? Book { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string? Content { get; set; }
        public int? ReplyToId {get; set;}
        public Comment? ReplyTo { get; set; }
        public List<Comment> Replies  = new List<Comment>();
    }
}