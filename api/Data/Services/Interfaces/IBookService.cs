//api/Services/Interfaces/IBookService.cs
using api.Models.Entities;
using MilLib.Helpers;
using MilLib.Models.DTOs.Book;

namespace MilLib.Services.Interfaces
{
    public interface IBookService
    {
        Task<PaginatedResult<BookDto>> GetAllBooksAsync(BookQueryObject query, string? userId = null);
        Task<BookDto?> GetBookByIdAsync(int id, string? userId = null);
        Task<BookDto> CreateBookAsync(BookCreateDto bookDto);
        Task<BookDto> UpdateBookAsync(int id, BookUpdateDto bookDto);
        Task DeleteBookAsync(int id);
        Task<BookLikeResultDto> ToggleLikeAsync(int bookId, string userId);
        Task<List<BookDto>> GetLikedBooksAsync(string userId, string? currentUserId = null);
        Task<List<int>> GetUserBookListIdsAsync(string userId, int bookId);
        Task<(byte[] fileContent, string contentType, string fileName)> GetBookFileAsync(int id);
    }

    public class BookLikeResultDto
    {
        public int LikesCount { get; set; }
        public bool IsLiked { get; set; }
    }
}