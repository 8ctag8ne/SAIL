using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace MilLib.Models.DTOs.Pdf
{
    public class PdfFileDto
    {
        [Required]
        [DataType(DataType.Upload)]
        public IFormFile File { get; set; } = null!;
    }
}
