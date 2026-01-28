//api/Services/Implementations/CommentService.cs
using api.Models.Entities;
using Microsoft.EntityFrameworkCore;
using MilLib.Helpers;
using MilLib.Models.DTOs.Comment;
using MilLib.Models.Entities;
using MilLib.Services.Interfaces;

namespace MilLib.Services.Implementations
{
    public class CommentService : ICommentService
    {
        private readonly ApplicationDbContext _context;

        public CommentService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<PaginatedResult<CommentDto>> GetAllCommentsAsync(CommentQueryObject query)
        {
            var commentsQuery = _context.Comments.AsQueryable();

            // Фільтрація за книгою
            if (query.BookId.HasValue)
            {
                commentsQuery = commentsQuery.Where(c => c.BookId == query.BookId.Value);
            }

            // Сортування
            if (!string.IsNullOrEmpty(query.SortBy))
            {
                commentsQuery = query.SortBy.ToLower() switch
                {
                    "date" => query.IsDescending
                        ? commentsQuery.OrderByDescending(c => c.CreatedAt)
                        : commentsQuery.OrderBy(c => c.CreatedAt),
                    _ => commentsQuery.OrderByDescending(c => c.Id)
                };
            }
            else
            {
                commentsQuery = commentsQuery.OrderByDescending(c => c.CreatedAt);
            }

            var totalItems = await commentsQuery.CountAsync();
            var totalPages = (int)Math.Ceiling(totalItems / (double)query.PageSize);
            var currentPage = Math.Clamp(query.PageNumber, 1, totalPages > 0 ? totalPages : 1);

            // ОПТИМІЗАЦІЯ: завантажуємо тільки потрібні дані без replies
            var comments = await commentsQuery
                .Skip(query.PageSize * (currentPage - 1))
                .Take(query.PageSize)
                .Select(c => new
                {
                    c.Id,
                    c.Content,
                    c.CreatedAt,
                    c.BookId,
                    c.ReplyToId,
                    c.UserId,
                    UserName = c.User.UserName
                })
                .AsNoTracking()
                .ToListAsync();

            var commentDtos = comments.Select(c => new CommentDto
            {
                Id = c.Id,
                Content = c.Content,
                CreatedAt = c.CreatedAt,
                BookId = c.BookId,
                ReplyToId = c.ReplyToId,
                UserId = c.UserId,
                UserName = c.UserName,
                Replies = new List<CommentSimpleDto>() // Порожній для оптимізації списку
            }).ToList();

            return new PaginatedResult<CommentDto>
            {
                Items = commentDtos,
                TotalItems = totalItems,
                TotalPages = totalPages,
                CurrentPage = currentPage
            };
        }

        public async Task<List<CommentDto>> GetCommentsForBookAsync(int bookId)
        {
            // ОПТИМІЗАЦІЯ: завантажуємо тільки top-level коментарі + replies в одному запиті
            var comments = await _context.Comments
                .Where(c => c.BookId == bookId && c.ReplyToId == null) // Тільки кореневі
                .Select(c => new
                {
                    c.Id,
                    c.Content,
                    c.CreatedAt,
                    c.BookId,
                    c.ReplyToId,
                    c.UserId,
                    UserName = c.User.UserName,
                    Replies = c.Replies.Select(r => new
                    {
                        r.Id,
                        r.Content,
                        r.CreatedAt,
                        r.BookId,
                        r.ReplyToId,
                        r.UserId,
                        UserName = r.User.UserName
                    }).ToList()
                })
                .AsNoTracking()
                .ToListAsync();

            return comments.Select(c => new CommentDto
            {
                Id = c.Id,
                Content = c.Content,
                CreatedAt = c.CreatedAt,
                BookId = c.BookId,
                ReplyToId = c.ReplyToId,
                UserId = c.UserId,
                UserName = c.UserName,
                Replies = c.Replies.Select(r => new CommentSimpleDto
                {
                    Id = r.Id,
                    Content = r.Content,
                    CreatedAt = r.CreatedAt,
                    BookId = r.BookId,
                    ReplyToId = r.ReplyToId,
                    UserId = r.UserId,
                    UserName = r.UserName, // Тільки 1 рівень вкладеності
                }).ToList()
            }).ToList();
        }

        public async Task<CommentDto?> GetCommentByIdAsync(int id)
        {
            var comment = await _context.Comments
                .Where(c => c.Id == id)
                .Select(c => new
                {
                    c.Id,
                    c.Content,
                    c.CreatedAt,
                    c.BookId,
                    c.ReplyToId,
                    c.UserId,
                    UserName = c.User.UserName,
                    Replies = c.Replies.Select(r => new
                    {
                        r.Id,
                        r.Content,
                        r.CreatedAt,
                        r.BookId,
                        r.ReplyToId,
                        r.UserId,
                        UserName = r.User.UserName
                    }).ToList()
                })
                .AsNoTracking()
                .FirstOrDefaultAsync();

            if (comment == null) return null;

            return new CommentDto
            {
                Id = comment.Id,
                Content = comment.Content,
                CreatedAt = comment.CreatedAt,
                BookId = comment.BookId,
                ReplyToId = comment.ReplyToId,
                UserId = comment.UserId,
                UserName = comment.UserName,
                Replies = comment.Replies.Select(r => new CommentSimpleDto
                {
                    Id = r.Id,
                    Content = r.Content,
                    CreatedAt = r.CreatedAt,
                    BookId = r.BookId,
                    ReplyToId = r.ReplyToId,
                    UserId = r.UserId,
                    UserName = r.UserName,
                }).ToList()
            };
        }

        public async Task<CommentDto> CreateCommentAsync(CommentCreateDto commentDto, string userId)
        {
            // Валідація книги
            var bookExists = await _context.Books.AnyAsync(b => b.Id == commentDto.BookId);
            if (!bookExists)
                throw new InvalidOperationException($"Book with id {commentDto.BookId} doesn't exist");

            // Валідація батьківського коментаря
            if (commentDto.ReplyToId.HasValue)
            {
                var parentExists = await _context.Comments.AnyAsync(c => c.Id == commentDto.ReplyToId.Value);
                if (!parentExists)
                    throw new InvalidOperationException($"Comment with id {commentDto.ReplyToId} to reply to doesn't exist");
            }

            // Валідація контенту
            if (string.IsNullOrWhiteSpace(commentDto.Content))
                throw new InvalidOperationException("Comment content cannot be empty");

            // Створення коментаря
            var comment = new Comment
            {
                Content = commentDto.Content.Trim(),
                BookId = commentDto.BookId,
                ReplyToId = commentDto.ReplyToId,
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Comments.Add(comment);
            await _context.SaveChangesAsync();

            // Повертаємо створений коментар
            return await GetCommentByIdAsync(comment.Id) ?? throw new InvalidOperationException("Failed to retrieve created comment");
        }

        public async Task<CommentDto> UpdateCommentAsync(int id, CommentUpdateDto commentDto, string currentUserId, bool isAdmin)
        {
            // ОПТИМІЗАЦІЯ: завантажуємо мінімум для перевірки прав
            var comment = await _context.Comments
                .Where(c => c.Id == id)
                .Select(c => new { c.Id, c.UserId })
                .FirstOrDefaultAsync();

            if (comment == null)
                throw new InvalidOperationException("Comment not found");

            // Перевірка прав доступу
            if (!isAdmin && comment.UserId != currentUserId)
                throw new UnauthorizedAccessException("You don't have permission to update this comment");

            // Валідація контенту
            if (string.IsNullOrWhiteSpace(commentDto.Content))
                throw new InvalidOperationException("Comment content cannot be empty");

            // ОПТИМІЗАЦІЯ: ExecuteUpdateAsync
            await _context.Comments
                .Where(c => c.Id == id)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(c => c.Content, commentDto.Content.Trim()));

            // Повертаємо оновлений коментар
            return await GetCommentByIdAsync(id) ?? throw new InvalidOperationException("Failed to retrieve updated comment");
        }

        public async Task DeleteCommentAsync(int id, string currentUserId, bool isAdmin)
        {
            // ОПТИМІЗАЦІЯ: завантажуємо мінімум + кількість replies
            var comment = await _context.Comments
                .Where(c => c.Id == id)
                .Select(c => new
                {
                    c.Id,
                    c.UserId,
                    RepliesCount = c.Replies.Count()
                })
                .FirstOrDefaultAsync();

            if (comment == null)
                throw new InvalidOperationException("Comment not found");

            // Перевірка прав доступу
            if (!isAdmin && comment.UserId != currentUserId)
                throw new UnauthorizedAccessException("You don't have permission to delete this comment");

            // ОПТИМІЗАЦІЯ: ExecuteUpdateAsync для replies замість завантаження
            if (comment.RepliesCount > 0)
            {
                // Встановлюємо ReplyToId = null для всіх відповідей
                await _context.Comments
                    .Where(c => c.ReplyToId == id)
                    .ExecuteUpdateAsync(setters => setters
                        .SetProperty(c => c.ReplyToId, (int?)null));
            }

            // Видаляємо коментар
            _context.Comments.Remove(new Comment { Id = id });
            await _context.SaveChangesAsync();
        }
    }
}