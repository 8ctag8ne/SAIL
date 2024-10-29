using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MilLib.Models.Entities;

namespace MilLib.Models.DTOs.Tag
{
    public class TagCreateDto
    {
        public string? Title {get; set;}
        public string? Info {get; set;}
        public IFormFile? Image {get; set;}
        public List<int> BookIds {get; set;} = new List<int>();
    }
}