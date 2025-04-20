using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace MilLib.Models.DTOs.Book
{
    public class BookCreateDto
    {
        [Required]
        public required string Title {get; set;}
        public int AuthorId {get; set;}
        [Required]
        public IFormFile? File {get; set;}
        public IFormFile? Image {get; set;}
        public string? Info {get; set;}
        public List<int> TagIds {get; set;} = new List<int>();
    }
}