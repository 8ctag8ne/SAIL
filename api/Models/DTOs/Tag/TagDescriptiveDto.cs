using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace api.Models.DTOs.Tag
{
    public class TagDescriptiveDto
    {
        public int Id {get; set;}
        public string? Title {get; set;}
        public string? Info {get; set;}
    }
}