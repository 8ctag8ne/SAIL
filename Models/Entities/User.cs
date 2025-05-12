using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using MilLib.Models.Entities;

namespace api.Models.Entities
{
    public class User : IdentityUser
    {
        public string? About { get; set; }
        public List<Comment> Comments { get; set; } = new List<Comment>();
        public List<Like> Likes { get; set; } = new List<Like>();
        public List<BookList> BookLists { get; set; } = new List<BookList>();
    }
}