using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MilLib.Mappers;
using MilLib.Models.DTOs.Book;
using MilLib.Models.Entities;
using MilLib.Services.Interfaces;

namespace MilLib.Controllers
{
    [Route("api/[Controller]")]
    [ApiController]
    public class BookController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IFileService _fileService;
        public BookController(ApplicationDbContext context, IFileService fileService)
        {
            _context = context;
            _fileService = fileService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var Books = await _context.Books.Include(a => a.Tags).ToListAsync();
            var res = Books.Select(a => a.toBookDto());
            return Ok(res);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById([FromRoute] int id)
        {
            var Book  = await _context.Books.Include(a => a.Tags).FirstOrDefaultAsync(a => a.Id == id);
            if (Book == null)
            {
                return NotFound();
            }
            return Ok(Book.toBookDto());
        }

        [HttpPost("{AuthorId}")]
        public async Task<IActionResult> Create([FromRoute] int AuthorId, [FromForm] BookCreateDto BookDto)
        {
            if(! await _context.Authors.AnyAsync(a => a.Id == AuthorId))
            {
                return BadRequest("Author does not exist");
            }
            var Book = BookDto.toBookFromCreateDto();
            Book.ImageUrl = await _fileService.UploadAsync(BookDto.Image, "Books/Images");
            Book.FileUrl = await _fileService.UploadAsync(BookDto.File, "Books/Files");

            var tags = await _context.Tags.Where(t => BookDto.TagIds.Contains(t.Id)).ToListAsync();
            Book.Tags = tags.Select(t => new BookTag { Book = Book, Tag = t }).ToList();

            _context.Books.Add(Book);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new {id = Book.Id}, Book.toBookDto());
        }

        [HttpPut]
        [Route("{id}")]
        public async Task<IActionResult> Update([FromRoute] int id, [FromForm] BookUpdateDto BookDto)
        {
            var Book = await _context.Books.FindAsync(id);
            if (Book == null)
            {
                return NotFound();
            }
            Book.Title = BookDto.Title;
            Book.Info = BookDto.Info;
            if(BookDto.Image != null && BookDto.Image.Length > 0)
            {
                if(Book.ImageUrl != null)
                {
                    await _fileService.DeleteAsync(Book.ImageUrl);
                }
                Book.ImageUrl = await _fileService.UploadAsync(BookDto.Image, "Books/Images");
            }

            if(BookDto.File != null && BookDto.File.Length > 0)
            {
                if(Book.FileUrl != null)
                {
                    await _fileService.DeleteAsync(Book.FileUrl);
                }
                Book.FileUrl = await _fileService.UploadAsync(BookDto.File, "Books/Files");
            }
            var existingBookTags = await _context.BookTags.Where(bt => bt.BookId == Book.Id).ToListAsync();
            _context.BookTags.RemoveRange(existingBookTags);
            
            var tags = await _context.Tags.Where(t => BookDto.TagIds.Contains(t.Id)).ToListAsync();
            Book.Tags = tags.Select(t => new BookTag { Book = Book, Tag = t }).ToList();

            _context.Books.Update(Book);
            await _context.SaveChangesAsync();

            return Ok(Book.toBookDto());
        }

        [HttpDelete]
        [Route("{id}")]
        public async Task<IActionResult> Delete([FromRoute] int id)
        {
            var Book = await _context.Books.FindAsync(id);
            if (Book == null)
            {
                return NotFound();
            }
            _context.Books.Remove(Book);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        
    }
}