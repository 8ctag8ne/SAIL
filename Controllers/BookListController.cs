using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MilLib.Mappers;
using MilLib.Models.DTOs.Book;
using MilLib.Models.DTOs.BookList;
using MilLib.Models.Entities;
using MilLib.Services.Interfaces;

namespace MilLib.Controllers
{
    [Route("api/[Controller]")]
    [ApiController]
    public class BookListController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IFileService _fileService;
        public BookListController(ApplicationDbContext context, IFileService fileService)
        {
            _context = context;
            _fileService = fileService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var BookLists = await _context.BookLists.Include(a => a.Books).ToListAsync();
            var res = BookLists.Select(a => a.toBookListDto());
            return Ok(res);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById([FromRoute] int id)
        {
            var BookList  = await _context.BookLists.Include(a => a.Books).FirstOrDefaultAsync(a => a.Id == id);
            if (BookList == null)
            {
                return NotFound();
            }
            return Ok(BookList.toBookListDto());
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] BookListCreateDto BookListDto)
        {
            var BookList = BookListDto.toBookListFromCreateDto();

            var books = await _context.Books.Where(b => BookListDto.BookIds.Contains(b.Id)).ToListAsync();
            BookList.Books = books.Select(b => new BookListBook { BookList = BookList, Book = b }).ToList();

            _context.BookLists.Add(BookList);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new {id = BookList.Id}, BookList.toBookListDto());
        }

        [HttpPut]
        [Route("{id}")]
        public async Task<IActionResult> Update([FromRoute] int id, [FromBody] BookListUpdateDto BookListDto)
        {
            var BookList = await _context.BookLists.FindAsync(id);
            if (BookList == null)
            {
                return NotFound();
            }
            BookList.Title = BookListDto.Title;
            BookList.Description = BookListDto.Description;
            BookList.IsPrivate = BookListDto.IsPrivate;

            var existingBookListBooks = await _context.BookListBooks.Where(bt => bt.BookListId == BookList.Id).ToListAsync();
            _context.BookListBooks.RemoveRange(existingBookListBooks);
            
            var books = await _context.Books.Where(b => BookListDto.BookIds.Contains(b.Id)).ToListAsync();
            BookList.Books = books.Select(b => new BookListBook { BookList = BookList, Book = b }).ToList();

            _context.BookLists.Update(BookList);
            await _context.SaveChangesAsync();

            return Ok(BookList.toBookListDto());
        }

        [HttpDelete]
        [Route("{id}")]
        public async Task<IActionResult> Delete([FromRoute] int id)
        {
            var BookList = await _context.BookLists.FindAsync(id);
            if (BookList == null)
            {
                return NotFound();
            }
            _context.BookLists.Remove(BookList);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        
    }
}