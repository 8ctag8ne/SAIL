using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MilLib.Mappers;
using MilLib.Models.DTOs.Author;
using MilLib.Services.Interfaces;

namespace MilLib.Controllers
{
    [Route("api/[Controller]")]
    [ApiController]
    public class AuthorController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IFileService _fileService;
        public AuthorController(ApplicationDbContext context, IFileService fileService)
        {
            _context = context;
            _fileService = fileService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var authors = await _context.Authors.Include(a => a.Books).ToListAsync();
            var res = authors.Select(a => a.toAuthorDto());
            return Ok(res);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById([FromRoute] int id)
        {
            var author  = await _context.Authors.Include(a => a.Books).FirstOrDefaultAsync(a => a.Id == id);
            if (author == null)
            {
                return NotFound();
            }
            return Ok(author.toAuthorDto());
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromForm] AuthorCreateDto authorDto)
        {
            var author = authorDto.toAuthorFromCreateDto();
            author.ImageUrl = await _fileService.UploadAsync(authorDto.Image, "Authors/Images");

            _context.Authors.Add(author);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new {id = author.Id}, author.toAuthorDto());
        }

        [HttpPut]
        [Route("{id}")]
        public async Task<IActionResult> Update([FromRoute] int id, [FromForm] AuthorUpdateDto authorDto)
        {
            var author = await _context.Authors.FindAsync(id);
            if (author == null)
            {
                return NotFound();
            }
            author.Name = authorDto.Name;
            author.Info = authorDto.Info;
            if(authorDto.Image != null &&authorDto.Image.Length > 0)
            {
                if(author.ImageUrl != null)
                {
                    await _fileService.DeleteAsync(author.ImageUrl);
                }
                author.ImageUrl = await _fileService.UploadAsync(authorDto.Image, "Authors/Images");
            }
            _context.Authors.Update(author);
            await _context.SaveChangesAsync();

            return Ok(author.toAuthorDto());
        }

        [HttpDelete]
        [Route("{id}")]
        public async Task<IActionResult> Delete([FromRoute] int id)
        {
            var author = await _context.Authors.FindAsync(id);
            if (author == null)
            {
                return NotFound();
            }
            _context.Authors.Remove(author);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private Task<bool> Exists(int id)
        {
            return _context.Authors.AnyAsync(author => author.Id == id);
        }
        
    }
}