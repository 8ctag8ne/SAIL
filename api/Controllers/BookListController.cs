//api/Controllers/BookListController.cs
using api.Extensions;
using api.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MilLib.Models.DTOs.BookList;
using MilLib.Services.Interfaces;

namespace MilLib.Controllers
{
    [Route("api/[Controller]")]
    [ApiController]
    public class BookListController : ControllerBase
    {
        private readonly IBookListService _bookListService;
        private readonly UserManager<User> _userManager;

        public BookListController(IBookListService bookListService, UserManager<User> userManager)
        {
            _bookListService = bookListService;
            _userManager = userManager;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var bookLists = await _bookListService.GetAllBookListsAsync();
                return Ok(bookLists);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving book lists", error = ex.Message });
            }
        }

        [HttpGet("get-booklists/{userId}")]
        public async Task<IActionResult> GetBookListsForUser([FromRoute] string userId)
        {
            try
            {
                string? currentUserId = null;
                bool isAdmin = false;

                if (User.Identity?.IsAuthenticated == true)
                {
                    var username = User.GetUsername();
                    var currentUser = await _userManager.FindByNameAsync(username);
                    currentUserId = currentUser?.Id;
                    isAdmin = User.IsInRole("Admin");
                }

                var bookLists = await _bookListService.GetBookListsForUserAsync(userId, currentUserId, isAdmin);
                return Ok(bookLists);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving book lists", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById([FromRoute] int id)
        {
            try
            {
                var bookList = await _bookListService.GetBookListByIdAsync(id);
                if (bookList == null)
                    return NotFound(new { message = "Book list not found" });

                return Ok(bookList);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving the book list", error = ex.Message });
            }
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] BookListCreateDto bookListDto)
        {
            try
            {
                var username = User.GetUsername();
                var user = await _userManager.FindByNameAsync(username);
                if (user == null)
                    return Unauthorized(new { message = "User not found" });

                var bookList = await _bookListService.CreateBookListAsync(bookListDto, user.Id);
                return CreatedAtAction(nameof(GetById), new { id = bookList.Id }, bookList);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating the book list", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> Update([FromRoute] int id, [FromBody] BookListUpdateDto bookListDto)
        {
            try
            {
                var username = User.GetUsername();
                var user = await _userManager.FindByNameAsync(username);
                if (user == null)
                    return Unauthorized(new { message = "User not found" });

                var bookList = await _bookListService.UpdateBookListAsync(id, bookListDto, user.Id);
                return Ok(bookList);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                if (ex.Message.Contains("not found"))
                    return NotFound(new { message = ex.Message });
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating the book list", error = ex.Message });
            }
        }

        [HttpPost("add-book")]
        [Authorize]
        public async Task<IActionResult> AddBookToLists([FromBody] AddBookToListsDto dto)
        {
            try
            {
                var username = User.GetUsername();
                var user = await _userManager.FindByNameAsync(username);
                if (user == null)
                    return Unauthorized(new { message = "User not found" });

                await _bookListService.AddBookToListsAsync(dto.BookId, dto.BookListIds, user.Id);
                return Ok(new { message = "Book added to lists successfully" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while adding book to lists", error = ex.Message });
            }
        }

        [HttpDelete("remove-book")]
        [Authorize]
        public async Task<IActionResult> RemoveBookFromList([FromQuery] int bookId, [FromQuery] int listId)
        {
            try
            {
                var username = User.GetUsername();
                var user = await _userManager.FindByNameAsync(username);
                if (user == null)
                    return Unauthorized(new { message = "User not found" });

                await _bookListService.RemoveBookFromListAsync(bookId, listId, user.Id);
                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while removing book from list", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> Delete([FromRoute] int id)
        {
            try
            {
                var username = User.GetUsername();
                var user = await _userManager.FindByNameAsync(username);
                if (user == null)
                    return Unauthorized(new { message = "User not found" });

                await _bookListService.DeleteBookListAsync(id, user.Id);
                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while deleting the book list", error = ex.Message });
            }
        }
    }
}