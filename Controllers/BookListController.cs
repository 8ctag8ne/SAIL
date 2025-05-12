using api.Extensions;
using api.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MilLib.Mappers;
using MilLib.Models.DTOs.BookList;
using MilLib.Repositories.Interfaces;
using MilLib.Services.Interfaces;

namespace MilLib.Controllers
{
    [Route("api/[Controller]")]
    [ApiController]
    public class BookListController : ControllerBase
    {
        private readonly IBookListRepository _bookListRepository;
        private readonly IBookRepository _bookRepository;
        private readonly UserManager<User> _userManager;

        public BookListController(IBookListRepository bookListRepository, IBookRepository bookRepository, UserManager<User> userManager)
        {
            _bookListRepository = bookListRepository;
            _bookRepository = bookRepository;
            _userManager = userManager;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll()
        {
            var bookLists = await _bookListRepository.GetAllWithBooksAsync();
            var res = bookLists.Select(b => b.toBookListDto());
            return Ok(res);
        }

        [HttpGet("get-booklists/{userId}")]
        public async Task<IActionResult> GetBookListsForUser([FromRoute] string userId)
        {
            var bookLists = await _bookListRepository.GetAllWithBooksAsync();
            var res = bookLists.Where(bl => bl.UserId == userId).Select(b => b.toBookListDto());
            var currentUser = await _userManager.FindByNameAsync(User.GetUsername());
            var currentUserId = currentUser?.Id;
            if(User.Identity?.IsAuthenticated == false || (!User.IsInRole("Admin") && currentUserId != userId))
            {
                res = res.Where(bl => (bool)!bl.IsPrivate);
            }
            return Ok(res);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById([FromRoute] int id)
        {
            var bookList = await _bookListRepository.GetByIdWithBooksAsync(id);

            if (bookList == null)
            {
                return NotFound();
            }

            string? username = null;
            if(bookList?.UserId != null)
            {
                var user = await _userManager.FindByIdAsync(bookList.UserId);
                username = user?.UserName;
            }
            return Ok(bookList.toBookListDto());
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] BookListCreateDto bookListDto)
        {
            var bookList = bookListDto.toBookListFromCreateDto();

            var username = User.GetUsername();
            var user = await _userManager.FindByNameAsync(username);
            if (user == null)
            {
                return Unauthorized();
            }

            bookList.UserId = user.Id;
            var books = await _bookRepository.GetByIdsAsync(bookListDto.BookIds);

            bookList.Books = books.Select(b => new Models.Entities.BookListBook
            {
                BookList = bookList,
                Book = b
            }).ToList();

            await _bookListRepository.AddAsync(bookList);
            await _bookListRepository.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = bookList.Id }, bookList.toBookListDto());
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> Update([FromRoute] int id, [FromBody] BookListUpdateDto bookListDto)
        {
            var bookList = await _bookListRepository.GetByIdWithBooksAsync(id);
            if (bookList == null)
            {
                return NotFound();
            }

            bookList.Title = bookListDto.Title;
            bookList.Description = bookListDto.Description;
            bookList.IsPrivate = bookListDto.IsPrivate;

            await _bookListRepository.ClearBooksAsync(bookList.Id);

            var books = await _bookRepository.GetByIdsAsync(bookListDto.BookIds);
            bookList.Books = books.Select(b => new Models.Entities.BookListBook
            {
                BookListId = bookList.Id,
                Book = b
            }).ToList();

            _bookListRepository.Update(bookList);
            await _bookListRepository.SaveChangesAsync();

            return Ok(bookList.toBookListDto());
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> Delete([FromRoute] int id)
        {
            var bookList = await _bookListRepository.GetByIdAsync(id);
            if (bookList == null)
            {
                return NotFound();
            }

            _bookListRepository.Remove(bookList);
            await _bookListRepository.SaveChangesAsync();

            return NoContent();
        }
    }
}
