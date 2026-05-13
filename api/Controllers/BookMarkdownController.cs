using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MilLib.Models.DTOs.BookMarkdown;
using MilLib.Models.Entities;

namespace MilLib.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,Librarian")]
    public class BookMarkdownController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public BookMarkdownController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("{bookId}")]
        public async Task<IActionResult> GetByBookId(int bookId)
        {
            var markdown = await _context.BookMarkdowns
                .FirstOrDefaultAsync(m => m.BookId == bookId);

            if (markdown == null)
            {
                return NotFound("Markdown content not found for this book.");
            }

            return Ok(new BookMarkdownDto
            {
                Id = markdown.Id,
                BookId = markdown.BookId,
                Content = markdown.Content
            });
        }

        [HttpPost("{bookId}")]
        public async Task<IActionResult> Create(int bookId, [FromBody] string content)
        {
            var book = await _context.Books
                .Include(b => b.BookMarkdown)
                .FirstOrDefaultAsync(b => b.Id == bookId);

            if (book == null)
            {
                return NotFound("Book not found.");
            }

            if (book.BookMarkdown != null)
            {
                return BadRequest("Markdown for this book already exists. Use PUT to update.");
            }

            var markdown = new BookMarkdown
            {
                BookId = bookId,
                Content = content
            };

            _context.BookMarkdowns.Add(markdown);
            
            // Mark as parsed
            book.Parsed = true;
            
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetByBookId), new { bookId = markdown.BookId }, new BookMarkdownDto
            {
                Id = markdown.Id,
                BookId = markdown.BookId,
                Content = markdown.Content
            });
        }

        [HttpPut("{bookId}")]
        public async Task<IActionResult> Update(int bookId, [FromBody] string content)
        {
            var book = await _context.Books
                .Include(b => b.BookMarkdown)
                .FirstOrDefaultAsync(b => b.Id == bookId);

            if (book == null)
            {
                return NotFound("Book not found.");
            }

            if (book.BookMarkdown == null)
            {
                return NotFound("Markdown for this book does not exist. Use POST to create.");
            }

            book.BookMarkdown.Content = content;
            book.Parsed = true;

            await _context.SaveChangesAsync();

            return Ok(new BookMarkdownDto
            {
                Id = book.BookMarkdown.Id,
                BookId = book.BookMarkdown.BookId,
                Content = book.BookMarkdown.Content
            });
        }

        [HttpDelete("{bookId}")]
        public async Task<IActionResult> Delete(int bookId)
        {
            var book = await _context.Books
                .Include(b => b.BookMarkdown)
                .FirstOrDefaultAsync(b => b.Id == bookId);

            if (book == null)
            {
                return NotFound("Book not found.");
            }

            if (book.BookMarkdown == null)
            {
                return NotFound("Markdown not found.");
            }

            _context.BookMarkdowns.Remove(book.BookMarkdown);
            
            book.Parsed = false; // Revert parsed status if deleted
            book.Processed = false; // Chunks might be invalidated if markdown is deleted

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
