using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace MilLib.Models.DTOs.Author
{
    public class AuthorCreateDto
    {
        [Required]
        public string? Name {get; set;}
        public IFormFile? Image {get; set;}
        public string? Info {get; set;}
    }
}