//api/Services/Interfaces/IBookListService.cs
using MilLib.Models.DTOs.BookList;

namespace MilLib.Services.Interfaces
{
    public interface IBookListService
    {
        Task<List<BookListDto>> GetAllBookListsAsync(); // Тільки для Admin
        Task<List<BookListDto>> GetBookListsForUserAsync(string userId, string? currentUserId, bool isAdmin);
        Task<BookListDto?> GetBookListByIdAsync(int id);
        Task<BookListDto> CreateBookListAsync(BookListCreateDto bookListDto, string userId);
        Task<BookListDto> UpdateBookListAsync(int id, BookListUpdateDto bookListDto, string currentUserId);
        Task AddBookToListsAsync(int bookId, List<int> bookListIds, string currentUserId);
        Task RemoveBookFromListAsync(int bookId, int listId, string currentUserId);
        Task DeleteBookListAsync(int id, string currentUserId);
    }
}