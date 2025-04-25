using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MilLib.Models.DTOs.Comment
{
    public class CommentSimpleDto
    {
        public int Id { get; set; }
        public string? UserId { get; set; }
        public int BookId { get; set; }
        public DateTime? CreatedAt { get; set; }
        public string? Content { get; set; }
        public int? ReplyToId {get; set;}
    }
}