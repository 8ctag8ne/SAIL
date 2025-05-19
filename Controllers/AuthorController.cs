using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MilLib.Mappers;
using MilLib.Models.DTOs.Author;
using MilLib.Models.Entities;
using MilLib.Repositories.Interfaces;
using MilLib.Services.Interfaces;

namespace MilLib.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthorController : ControllerBase
    {
        private readonly IAuthorRepository _authorRepository;
        private readonly IFileService _fileService;

        public AuthorController(IAuthorRepository authorRepository, IFileService fileService)
        {
            _authorRepository = authorRepository;
            _fileService = fileService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var authors = await _authorRepository.GetAllWithBooksAsync();
            var res = authors.Select(a => a.toAuthorDto());
            return Ok(res);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var author = await _authorRepository.GetByIdWithBooksAsync(id);
            if (author == null)
                return NotFound();

            return Ok(author.toAuthorDto());
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Create([FromForm] AuthorCreateDto authorDto)
        {
            var author = authorDto.toAuthorFromCreateDto();
            author.ImageUrl = await _fileService.UploadAsync(authorDto.Image, "Authors/Images");

            await _authorRepository.AddAsync(author);
            await _authorRepository.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = author.Id }, author.toAuthorDto());
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Update(int id, [FromForm] AuthorUpdateDto authorDto)
        {
            var author = await _authorRepository.GetByIdAsync(id);
            if (author == null)
                return NotFound();

            if (authorDto.Name != null)
                author.Name = authorDto.Name;
            if (authorDto.Info != null)
                author.Info = authorDto.Info;

            if (authorDto.Image != null && authorDto.Image.Length > 0)
            {
                if (!string.IsNullOrEmpty(author.ImageUrl))
                    await _fileService.DeleteAsync(author.ImageUrl);

                author.ImageUrl = await _fileService.UploadAsync(authorDto.Image, "Authors/Images");
            }

            _authorRepository.Update(author);
            await _authorRepository.SaveChangesAsync();

            return Ok(author.toAuthorDto());
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var author = await _authorRepository.GetByIdAsync(id);
            if (author == null)
                return NotFound();

            _authorRepository.Remove(author);
            await _authorRepository.SaveChangesAsync();

            return NoContent();
        }

        private Task<bool> Exists(int id) => _authorRepository.ExistsAsync(id);
    }
}
