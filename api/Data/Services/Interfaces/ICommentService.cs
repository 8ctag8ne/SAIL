//api/Services/Interfaces/ICommentService.cs
using api.Models.Entities;
using MilLib.Helpers;
using MilLib.Models.DTOs.Comment;

namespace MilLib.Services.Interfaces
{
    public interface ICommentService
    {
        Task<PaginatedResult<CommentDto>> GetAllCommentsAsync(CommentQueryObject query);
        Task<List<CommentDto>> GetCommentsForBookAsync(int bookId);
        Task<CommentDto?> GetCommentByIdAsync(int id);
        Task<CommentDto> CreateCommentAsync(CommentCreateDto commentDto, string userId);
        Task<CommentDto> UpdateCommentAsync(int id, CommentUpdateDto commentDto, string currentUserId, bool isAdmin);
        Task DeleteCommentAsync(int id, string currentUserId, bool isAdmin);
    }

    // Query object для пагінації коментарів
    public class CommentQueryObject
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        public int? BookId { get; set; }
        public string? SortBy { get; set; }
        public bool IsDescending { get; set; } = true;
    }
}