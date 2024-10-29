using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MilLib.Mappers;
using MilLib.Models.DTOs.Author;
using MilLib.Models.DTOs.Tag;
using MilLib.Models.Entities;
using MilLib.Services.Interfaces;

namespace MilLib.Controllers
{
    [Route("api/[Controller]")]
    [ApiController]
    public class TagController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IFileService _fileService;
        public TagController(ApplicationDbContext context, IFileService fileService)
        {
            _context = context;
            _fileService = fileService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var Tags = await _context.Tags.Include(a => a.Books).ToListAsync();
            var res = Tags.Select(a => a.toTagDto());
            return Ok(res);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById([FromRoute] int id)
        {
            var Tag  = await _context.Tags.Include(a => a.Books).FirstOrDefaultAsync(a => a.Id == id);
            if (Tag == null)
            {
                return NotFound();
            }
            return Ok(Tag.toTagDto());
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromForm] TagCreateDto TagDto)
        {
            var Tag = TagDto.toTagFromCreateDto();
            Tag.ImageUrl = await _fileService.UploadAsync(TagDto.Image, "Tags/Images");
            
            var books = await _context.Books.Where(t => TagDto.BookIds.Contains(t.Id)).ToListAsync();
            Tag.Books = books.Select(t => new BookTag {Tag = Tag, Book = t }).ToList();

            _context.Tags.Add(Tag);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new {id = Tag.Id}, Tag.toTagDto());
        }

        [HttpPut]
        [Route("{id}")]
        public async Task<IActionResult> Update([FromRoute] int id, [FromForm] TagUpdateDto TagDto)
        {
            var Tag = await _context.Tags.FindAsync(id);
            if (Tag == null)
            {
                return NotFound();
            }
            Tag.Title = TagDto.Title;
            Tag.Info = TagDto.Info;
            if(TagDto.Image != null && TagDto.Image.Length > 0)
            {
                if(Tag.ImageUrl != null)
                {
                    await _fileService.DeleteAsync(Tag.ImageUrl);
                }
                Tag.ImageUrl = await _fileService.UploadAsync(TagDto.Image, "Tags/Images");
            }


            var existingBookTags = await _context.BookTags.Where(bt => bt.TagId == Tag.Id).ToListAsync();
            _context.BookTags.RemoveRange(existingBookTags);

            var books = await _context.Books.Where(t => TagDto.BookIds.Contains(t.Id)).ToListAsync();
            Tag.Books = books.Select(t => new BookTag {Tag = Tag, Book = t }).ToList();
            _context.Tags.Update(Tag);
            await _context.SaveChangesAsync();

            return Ok(Tag.toTagDto());
        }

        [HttpDelete]
        [Route("{id}")]
        public async Task<IActionResult> Delete([FromRoute] int id)
        {
            var Tag = await _context.Tags.FindAsync(id);
            if (Tag == null)
            {
                return NotFound();
            }
            _context.Tags.Remove(Tag);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}