using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using MilLib.Helpers;
using MilLib.Mappers;
using MilLib.Models.DTOs.Book;
using MilLib.Services.Interfaces;
using MilLib.Repositories.Interfaces; // інтерфейс репозиторію
using MilLib.Models.Entities;

namespace MilLib.Controllers
{
    [Route("api/[Controller]")]
    [ApiController]
    public class BookController : ControllerBase
    {
        private readonly IBookRepository _bookRepository;
        private readonly IFileService _fileService;

        public BookController(IBookRepository bookRepository, IFileService fileService)
        {
            _bookRepository = bookRepository;
            _fileService = fileService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] BookQueryObject query)
        {
            var books = await _bookRepository.GetAllAsync(query);
            return Ok(books.Select(b => b.toBookDto()));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById([FromRoute] int id)
        {
            var book = await _bookRepository.GetByIdWithDetailsAsync(id);
            if (book == null) return NotFound();
            return Ok(book.toBookDto());
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromForm] BookCreateDto bookDto)
        {
            if (!await _bookRepository.AuthorExistsAsync(bookDto.AuthorId))
            {
                return BadRequest("Author does not exist");
            }

            if (await _bookRepository.TitleExistsAsync(bookDto.Title))
            {
                return BadRequest("Book with this title already exists");
            }

            var book = bookDto.toBookFromCreateDto();
            book.ImageUrl = await _fileService.UploadAsync(bookDto.Image, "Books/Images");
            book.FileUrl = await _fileService.UploadAsync(bookDto.File, "Books/Files");

            await _bookRepository.AddAsync(book, bookDto.TagIds);

            return CreatedAtAction(nameof(GetById), new { id = book.Id }, book.toBookDto());
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update([FromRoute] int id, [FromForm] BookUpdateDto bookDto)
        {
            var book = await _bookRepository.GetByIdAsync(id);
            if (book == null) return NotFound();

            if (book.Title == bookDto.Title)
                bookDto.Title = null;

            if (bookDto.Title is not null && await _bookRepository.TitleExistsAsync(bookDto.Title))
            {
                return BadRequest("Book with this title already exists");
            }

            if (!bookDto.Title.IsNullOrEmpty())
            {
                book.Title = bookDto.Title;
            }

            book.Info = bookDto.Info;

            if (bookDto.Image != null && bookDto.Image.Length > 0)
            {
                if (book.ImageUrl != null)
                {
                    await _fileService.DeleteAsync(book.ImageUrl);
                }
                book.ImageUrl = await _fileService.UploadAsync(bookDto.Image, "Books/Images");
            }

            if (bookDto.File != null && bookDto.File.Length > 0)
            {
                if (book.FileUrl != null)
                {
                    await _fileService.DeleteAsync(book.FileUrl);
                }
                book.FileUrl = await _fileService.UploadAsync(bookDto.File, "Books/Files");
            }

            await _bookRepository.UpdateAsync(book, bookDto.TagIds);

            return Ok(book.toBookDto());
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete([FromRoute] int id)
        {
            var book = await _bookRepository.GetByIdAsync(id);
            if (book == null) return NotFound();

            await _bookRepository.DeleteAsync(book);
            return NoContent();
        }
    }
}
