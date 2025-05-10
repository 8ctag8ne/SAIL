using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MilLib.Models.DTOs.Book;
using MilLib.Models.Entities;
namespace MilLib.Models.DTOs.Author
{
    public class AuthorSimpleDto
    {
        public int Id {get; set;}
        public string? Name {get; set;}
    }
}