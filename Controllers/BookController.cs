using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using MilLib.Helpers;
using MilLib.Mappers;
using MilLib.Models.DTOs.Book;
using MilLib.Services.Interfaces;
using MilLib.Repositories.Interfaces; // інтерфейс репозиторію
using MilLib.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using api.Extensions;
using Microsoft.AspNetCore.Identity;
using api.Models.Entities;
using api.Data.Repositories.Interfaces;

namespace MilLib.Controllers
{
    [Route("api/[Controller]")]
    [ApiController]
    public class BookController : ControllerBase
    {
        private readonly IBookRepository _bookRepository;
        private readonly ILikeRepository _likeRepository;
        private readonly IFileService _fileService;

        private readonly UserManager<User> _userManager;

        public BookController(IBookRepository bookRepository, IFileService fileService, UserManager<User> userManager, ILikeRepository likeRepository)
        {
            _bookRepository = bookRepository;
            _fileService = fileService;
            _userManager = userManager;
            _likeRepository = likeRepository;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] BookQueryObject query)
        {
            var result = await _bookRepository.GetAllAsync(query);

            var dtoResult = new PaginatedResult<BookDto>
            {
                Items = result.Items.Select(b => b.toBookDto()).ToList(),
                TotalItems = result.TotalItems,
                TotalPages = result.TotalPages,
                CurrentPage = result.CurrentPage
            };
            if(User.Identity?.IsAuthenticated == true)
            {
                var username = User.GetUsername();
                var user = await _userManager.FindByNameAsync(username);
                if (user != null)
                {
                    foreach(var item in dtoResult.Items)
                    {
                        var like = await _likeRepository.GetAsync(item.Id, user.Id);
                        item.IsLiked = like != null;
                    }
                }
            }
            return Ok(dtoResult);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById([FromRoute] int id)
        {
            var book = await _bookRepository.GetByIdWithDetailsAsync(id);
            if (book == null) return NotFound();
            if(User.Identity?.IsAuthenticated == true)
            {
                var username = User.GetUsername();
                var user = await _userManager.FindByNameAsync(username);
                if (user == null)
                    return Unauthorized();

                var like = await _likeRepository.GetAsync(id, user.Id);
                return Ok(book.toBookDto(like is not null));
            }
            return Ok(book.toBookDto());
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Librarian")]
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
        [Authorize(Roles = "Admin,Librarian")]
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

            book.AuthorId = bookDto.AuthorId;

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
        [Authorize(Roles = "Admin,Librarian")]
        public async Task<IActionResult> Delete([FromRoute] int id)
        {
            var book = await _bookRepository.GetByIdAsync(id);
            if (book == null) return NotFound();

            await _bookRepository.DeleteAsync(book);
            return NoContent();
        }

        [Authorize]
        [HttpPost("{bookId}/toggle-like")]
        public async Task<IActionResult> ToggleLike([FromRoute] int bookId)
        {
            var username = User.GetUsername();
            var user = await _userManager.FindByNameAsync(username);
            if (user == null)
                return Unauthorized();

            var book = await _bookRepository.GetByIdAsync(bookId);
            if (book == null)
                return NotFound();

            var existingLike = await _likeRepository.GetAsync(bookId, user.Id);

            if (existingLike != null)
            {
                await _likeRepository.RemoveAsync(existingLike);
                book.LikesCount = Math.Max(0, book.LikesCount - 1);
            }
            else
            {
                await _likeRepository.AddAsync(new Like
                {
                    BookId = bookId,
                    UserId = user.Id,
                });
                book.LikesCount += 1;
            }

            await _bookRepository.UpdateAsync(book, null);

            return Ok(new 
            { 
                LikesCount = book.LikesCount, 
                IsLiked = (existingLike is null) ? true : false 
            });
        }

        // [Authorize]
        [HttpGet("get-liked-books/{userId}")]
        public async Task<IActionResult> GetLikedBooks([FromRoute] string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return BadRequest();
            }

            var likes = await _likeRepository.GetUserLikesAsync(user);
            var bookIds = likes.Select(like => like.BookId).ToList();

            var books = await _bookRepository.GetByIdsWithDetailsAsync(bookIds);
            var bookDtos = books.Select(b => b.toBookDto()).ToList();
            if(User.Identity?.IsAuthenticated == true)
            {
                var username = User.GetUsername();
                var currentUser = await _userManager.FindByNameAsync(username);
                if (currentUser != null)
                {
                    foreach(var book in bookDtos)
                    {
                        var like = await _likeRepository.GetAsync(book.Id, currentUser.Id);
                        book.IsLiked = like != null;
                    }
                }
            }

            return Ok(bookDtos);
        }

        [HttpGet("{bookId}/user-booklists")]
        [Authorize]
        public async Task<ActionResult<List<int>>> GetBookListIdsForBook(int bookId)
        {
            var username = User.GetUsername();
            var user = await _userManager.FindByNameAsync(username);
            if(user == null)
            {
                return Unauthorized();
            }
            var userId = user.Id;
            var listIds = await _bookRepository.GetUserBookListIdsAsync(userId, bookId);
            return Ok(listIds);
        }

        [HttpGet("{id}/download")]
        public async Task<IActionResult> DownloadBook(int id)
        {
            var book = await _bookRepository.GetByIdWithDetailsAsync(id);
            if (book == null || string.IsNullOrWhiteSpace(book.FileUrl))
                return NotFound("Book or file not found");

            try
            {
                var (fileContent, contentType, fileName) = await _fileService.GetBookFileAsync(book.FileUrl, book.Title, book.Author.Name);
                return File(fileContent, contentType, fileName);
            }
            catch (FileServiceException ex)
            {
                return StatusCode(500, ex.Message);
            }
        }
    }
}
