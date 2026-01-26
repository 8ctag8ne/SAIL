//api/Controllers/BookController.cs
using Microsoft.AspNetCore.Mvc;
using MilLib.Helpers;
using MilLib.Models.DTOs.Book;
using MilLib.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using api.Extensions;
using Microsoft.AspNetCore.Identity;
using api.Models.Entities;

namespace MilLib.Controllers
{
    [Route("api/[Controller]")]
    [ApiController]
    public class BookController : ControllerBase
    {
        private readonly IBookService _bookService;
        private readonly UserManager<User> _userManager;

        public BookController(IBookService bookService, UserManager<User> userManager)
        {
            _bookService = bookService;
            _userManager = userManager;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] BookQueryObject query)
        {
            try
            {
                string? userId = null;
                if (User.Identity?.IsAuthenticated == true)
                {
                    var username = User.GetUsername();
                    var user = await _userManager.FindByNameAsync(username);
                    userId = user?.Id;
                }

                var result = await _bookService.GetAllBooksAsync(query, userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving books", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById([FromRoute] int id)
        {
            try
            {
                string? userId = null;
                if (User.Identity?.IsAuthenticated == true)
                {
                    var username = User.GetUsername();
                    var user = await _userManager.FindByNameAsync(username);
                    userId = user?.Id;
                }

                var book = await _bookService.GetBookByIdAsync(id, userId);
                if (book == null)
                    return NotFound(new { message = "Book not found" });

                return Ok(book);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving the book", error = ex.Message });
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Librarian")]
        public async Task<IActionResult> Create([FromForm] BookCreateDto bookDto)
        {
            try
            {
                var book = await _bookService.CreateBookAsync(bookDto);
                return CreatedAtAction(nameof(GetById), new { id = book.Id }, book);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating the book", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Librarian")]
        public async Task<IActionResult> Update([FromRoute] int id, [FromForm] BookUpdateDto bookDto)
        {
            try
            {
                var book = await _bookService.UpdateBookAsync(id, bookDto);
                return Ok(book);
            }
            catch (InvalidOperationException ex)
            {
                if (ex.Message.Contains("not found"))
                    return NotFound(new { message = ex.Message });
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating the book", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Librarian")]
        public async Task<IActionResult> Delete([FromRoute] int id)
        {
            try
            {
                await _bookService.DeleteBookAsync(id);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while deleting the book", error = ex.Message });
            }
        }

        [Authorize]
        [HttpPost("{bookId}/toggle-like")]
        public async Task<IActionResult> ToggleLike([FromRoute] int bookId)
        {
            try
            {
                var username = User.GetUsername();
                var user = await _userManager.FindByNameAsync(username);
                if (user == null)
                    return Unauthorized(new { message = "User not found" });

                var result = await _bookService.ToggleLikeAsync(bookId, user.Id);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while toggling like", error = ex.Message });
            }
        }

        [HttpGet("get-liked-books/{userId}")]
        public async Task<IActionResult> GetLikedBooks([FromRoute] string userId)
        {
            try
            {
                string? currentUserId = null;
                if (User.Identity?.IsAuthenticated == true)
                {
                    var username = User.GetUsername();
                    var user = await _userManager.FindByNameAsync(username);
                    currentUserId = user?.Id;
                }

                var books = await _bookService.GetLikedBooksAsync(userId, currentUserId);
                return Ok(books);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving liked books", error = ex.Message });
            }
        }

        [HttpGet("{bookId}/user-booklists")]
        [Authorize]
        public async Task<IActionResult> GetBookListIdsForBook(int bookId)
        {
            try
            {
                var username = User.GetUsername();
                var user = await _userManager.FindByNameAsync(username);
                if (user == null)
                    return Unauthorized(new { message = "User not found" });

                var listIds = await _bookService.GetUserBookListIdsAsync(user.Id, bookId);
                return Ok(listIds);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving book lists", error = ex.Message });
            }
        }

        [HttpGet("{id}/download")]
        public async Task<IActionResult> DownloadBook(int id)
        {
            try
            {
                var (fileContent, contentType, fileName) = await _bookService.GetBookFileAsync(id);
                return File(fileContent, contentType, fileName);
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (FileServiceException ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while downloading the book", error = ex.Message });
            }
        }
    }
}