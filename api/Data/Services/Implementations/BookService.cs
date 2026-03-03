//api/Services/Implementations/BookService.cs
using api.Models.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using MilLib.Helpers;
using MilLib.Mappers;
using MilLib.Models.DTOs.Author;
using MilLib.Models.DTOs.Book;
using MilLib.Models.DTOs.Comment;
using MilLib.Models.DTOs.Tag;
using MilLib.Models.Entities;
using MilLib.Services.Interfaces;

namespace MilLib.Services.Implementations
{
    public class BookService : IBookService
    {
        private readonly ApplicationDbContext _context;
        private readonly IFileService _fileService;
        private readonly UserManager<User> _userManager;

        public BookService(
            ApplicationDbContext context,
            IFileService fileService,
            UserManager<User> userManager)
        {
            _context = context;
            _fileService = fileService;
            _userManager = userManager;
        }

        public async Task<PaginatedResult<BookDto>> GetAllBooksAsync(BookQueryObject query, string? userId = null)
        {
            var booksQuery = _context.Books
                .AsNoTracking()
                .AsQueryable();

            // Фільтрація
            if (!string.IsNullOrEmpty(query.Title))
            {
                booksQuery = booksQuery.Where(b => b.Title.Contains(query.Title, StringComparison.OrdinalIgnoreCase));
            }

            if (query.TagIds != null && query.TagIds.Count != 0)
            {
                booksQuery = booksQuery.Where(b => b.Tags.Any(t => query.TagIds.Contains(t.TagId)));
            }

            if (query.AuthorIds != null && query.AuthorIds.Count != 0)
            {
                booksQuery = booksQuery.Where(b => b.Authors.Any(ab => query.AuthorIds.Contains(ab.AuthorId)));
            }

            // Сортування
            if (!string.IsNullOrEmpty(query.SortBy) && query.SortBy.ToLower() == "title")
            {
                booksQuery = query.IsDescenging
                    ? booksQuery.OrderByDescending(b => b.Title)
                    : booksQuery.OrderBy(b => b.Title);
            }
            else
            {
                booksQuery = booksQuery.OrderByDescending(b => b.Id);
            }

            var totalItems = await booksQuery.CountAsync();
            var totalPages = (int)Math.Ceiling(totalItems / (double)query.PageSize);
            var currentPage = Math.Clamp(query.PageNumber, 1, totalPages > 0 ? totalPages : 1);

            // ОПТИМІЗАЦІЯ: завантажуємо тільки необхідні дані для списку
            var books = await booksQuery
                .Skip(query.PageSize * (currentPage - 1))
                .Take(query.PageSize)
                .Select(b => new
                {
                    b.Id,
                    b.Title,
                    b.ImageUrl,
                    b.FileUrl,
                    b.Info,
                    b.LikesCount,
                    Tags = b.Tags.Select(bt => new { bt.Tag.Id, bt.Tag.Title }).ToList(),
                    Authors = b.Authors.Select(ab => new { ab.Author.Id, ab.Author.Name }).ToList()
                })
                .ToListAsync();

            var bookDtos = books.Select(b => new BookDto
            {
                Id = b.Id,
                Title = b.Title,
                ImageUrl = _fileService.GetFullUrl(b.ImageUrl),
                FileUrl = _fileService.GetFullUrl(b.FileUrl),
                Info = b.Info,
                LikesCount = b.LikesCount,
                Tags = b.Tags.Select(t => new TagSimpleDto { Id = t.Id, Title = t.Title }).ToList(),
                Authors = b.Authors.Select(a => new AuthorSimpleDto { Id = a.Id, Name = a.Name }).ToList()
            }).ToList();

            // ОПТИМІЗАЦІЯ: один запит для всіх лайків
            if (!string.IsNullOrEmpty(userId))
            {
                var bookIds = bookDtos.Select(b => b.Id).ToList();
                var likedBookIds = await _context.Likes
                    .Where(l => l.UserId == userId && bookIds.Contains(l.BookId))
                    .Select(l => l.BookId)
                    .ToListAsync();

                var likedSet = new HashSet<int>(likedBookIds);
                foreach (var dto in bookDtos)
                {
                    dto.IsLiked = likedSet.Contains(dto.Id);
                }
            }

            return new PaginatedResult<BookDto>
            {
                Items = bookDtos,
                TotalItems = totalItems,
                TotalPages = totalPages,
                CurrentPage = currentPage
            };
        }

        public async Task<BookDto?> GetBookByIdAsync(int id, string? userId = null)
        {
            // ОПТИМІЗАЦІЯ: одним запитом завантажуємо книгу + перевіряємо лайк
            var bookQuery = _context.Books
                .AsNoTracking()
                .Where(b => b.Id == id)
                .Select(b => new
                {
                    b.Id,
                    b.Title,
                    b.ImageUrl,
                    b.Info,
                    b.FileUrl,
                    b.LikesCount,
                    Tags = b.Tags.Select(bt => new { bt.Tag.Id, bt.Tag.Title }).ToList(),
                    Authors = b.Authors.Select(ab => new { ab.Author.Id, ab.Author.Name }).ToList(),
                    Comments = b.Comments.Select(c => new
                    {
                        c.Id,
                        c.Content,
                        c.CreatedAt,
                        c.ReplyToId,
                        User = new { c.User.Id, c.User.UserName }
                    }).ToList()
                });

            var book = await bookQuery.FirstOrDefaultAsync();
            if (book == null) return null;

            bool isLiked = false;
            if (!string.IsNullOrEmpty(userId))
            {
                isLiked = await _context.Likes
                    .AnyAsync(l => l.BookId == id && l.UserId == userId);
            }

            return new BookDto
            {
                Id = book.Id,
                Title = book.Title,
                ImageUrl = _fileService.GetFullUrl(book.ImageUrl),
                Info = book.Info,
                FileUrl = _fileService.GetFullUrl(book.FileUrl),
                LikesCount = book.LikesCount,
                IsLiked = isLiked,
                Tags = book.Tags.Select(t => new TagSimpleDto { Id = t.Id, Title = t.Title }).ToList(),
                Authors = book.Authors.Select(a => new AuthorSimpleDto { Id = a.Id, Name = a.Name }).ToList(),
                Comments = book.Comments.Select(c => new CommentDto
                {
                    Id = c.Id,
                    UserId = c.User.Id,
                    Content = c.Content,
                    CreatedAt = c.CreatedAt,
                    ReplyToId = c.ReplyToId,
                    UserName = c.User.UserName
                }).ToList()
            };
        }

        public async Task<BookDto> CreateBookAsync(BookCreateDto bookDto)
        {
            // Валідація авторів
            if (bookDto.AuthorIds == null || bookDto.AuthorIds.Count == 0)
                throw new InvalidOperationException("Authors are required");

            // ОПТИМІЗАЦІЯ: одним запитом перевіряємо всіх авторів
            var existingAuthorIds = await _context.Authors
                .Where(a => bookDto.AuthorIds.Contains(a.Id))
                .Select(a => a.Id)
                .ToListAsync();

            var missingAuthors = bookDto.AuthorIds.Except(existingAuthorIds).ToList();
            if (missingAuthors.Count != 0)
                throw new InvalidOperationException($"Authors not found: {string.Join(", ", missingAuthors)}");

            // Валідація унікальності назви
            if (await _context.Books.AnyAsync(b => b.Title == bookDto.Title))
                throw new InvalidOperationException("Book with this title already exists");

            // ОПТИМІЗАЦІЯ: обробка тегів оптимізовано
            var allTagIds = await ProcessTagsAsync(bookDto.TagIds, bookDto.NewTagTitles);

            // Завантаження файлів
            var imageUrl = await _fileService.UploadAsync(bookDto.Image, "Books/Images");
            var fileUrl = await _fileService.UploadAsync(bookDto.File, "Books/Files");

            // Створення книги
            var book = new Book
            {
                Title = bookDto.Title,
                Info = bookDto.Info,
                ImageUrl = imageUrl,
                FileUrl = fileUrl,
                LikesCount = 0
            };

            // Додаємо авторів
            foreach (var authorId in bookDto.AuthorIds)
            {
                book.Authors.Add(new AuthorBook { AuthorId = authorId, Book = book });
            }

            // Додаємо теги
            foreach (var tagId in allTagIds)
            {
                book.Tags.Add(new BookTag { TagId = tagId, Book = book });
            }

            _context.Books.Add(book);
            await _context.SaveChangesAsync();

            // Повертаємо створену книгу
            return await GetBookByIdAsync(book.Id) ?? throw new InvalidOperationException("Failed to retrieve created book");
        }

        public async Task<BookDto> UpdateBookAsync(int id, BookUpdateDto bookDto)
        {
            // ОПТИМІЗАЦІЯ: завантажуємо тільки те, що потрібно
            var book = await _context.Books
                .Include(b => b.Tags)
                .Include(b => b.Authors)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (book == null)
                throw new InvalidOperationException("Book not found");

            // Валідація унікальності назви (якщо змінюється)
            if (!string.IsNullOrEmpty(bookDto.Title) && book.Title != bookDto.Title)
            {
                if (await _context.Books.AnyAsync(b => b.Title == bookDto.Title))
                    throw new InvalidOperationException("Book with this title already exists");

                book.Title = bookDto.Title;
            }
            if(!string.IsNullOrEmpty(bookDto.Info))
            {
                book.Info = bookDto.Info;
            }

            // Обробка файлів
            if (bookDto.Image != null && bookDto.Image.Length > 0)
            {
                if (!string.IsNullOrEmpty(book.ImageUrl))
                    await _fileService.DeleteAsync(book.ImageUrl);
                book.ImageUrl = await _fileService.UploadAsync(bookDto.Image, "Books/Images");
            }

            if (bookDto.File != null && bookDto.File.Length > 0)
            {
                if (!string.IsNullOrEmpty(book.FileUrl))
                    await _fileService.DeleteAsync(book.FileUrl);
                book.FileUrl = await _fileService.UploadAsync(bookDto.File, "Books/Files");
            }

            // ОПТИМІЗАЦІЯ: оновлення тегів
            if (bookDto.TagIds != null || bookDto.NewTagTitles != null)
            {
                var allTagIds = await ProcessTagsAsync(bookDto.TagIds, bookDto.NewTagTitles);
                var newTagIds = allTagIds.Distinct().ToHashSet();
                var currentTagIds = book.Tags.Select(t => t.TagId).ToHashSet();

                //видаляємо старі зв'язки
                var tagsToRemove = book.Tags.Where(t => !newTagIds.Contains(t.TagId)).ToList();

                _context.BookTags.RemoveRange(tagsToRemove);


                var tagsToAdd = newTagIds
                    .Where(id => !currentTagIds.Contains(id))
                    .Select(id => new BookTag {BookId = book.Id, TagId = id})
                    .ToList();

                _context.BookTags.AddRange(tagsToAdd);
            }

            // ОПТИМІЗАЦІЯ: оновлення авторів
            if (bookDto.AuthorIds != null && bookDto.AuthorIds.Count != 0)
            {
                // Видаляємо старі зв'язки
                book.Authors.Clear();

                // Додаємо нові
                foreach (var authorId in bookDto.AuthorIds)
                {
                    book.Authors.Add(new AuthorBook { BookId = book.Id, AuthorId = authorId });
                }
            }

            await _context.SaveChangesAsync();

            // Повертаємо оновлену книгу
            return await GetBookByIdAsync(id) ?? throw new InvalidOperationException("Failed to retrieve updated book");
        }

        public async Task DeleteBookAsync(int id)
        {
            // ОПТИМІЗАЦІЯ: завантажуємо тільки Id та FileUrl
            var book = await _context.Books
                .Where(b => b.Id == id)
                .Select(b => new 
                { 
                    b.Id, 
                    b.Title, 
                    b.ImageUrl, 
                    b.FileUrl 
                })
                .FirstOrDefaultAsync();

            if (book == null)
                throw new InvalidOperationException("Book not found");

            // Видаляємо файли
            if (!string.IsNullOrEmpty(book.ImageUrl))
                await _fileService.DeleteAsync(book.ImageUrl);
            if (!string.IsNullOrEmpty(book.FileUrl))
                await _fileService.DeleteAsync(book.FileUrl);

            // Видаляємо книгу (cascade видалить зв'язки)
            _context.Books.Remove(new Book { Id = book.Id, Title = book.Title, });
            await _context.SaveChangesAsync();
        }

        public async Task<BookLikeResultDto> ToggleLikeAsync(int bookId, string userId)
        {
            // ОПТИМІЗАЦІЯ: використовуємо ізоляцію транзакції для уникнення race conditions
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // ОПТИМІЗАЦІЯ: завантажуємо тільки LikesCount
                var book = await _context.Books
                    .Where(b => b.Id == bookId)
                    .Select(b => new { b.Id, b.LikesCount })
                    .FirstOrDefaultAsync();

                if (book == null)
                    throw new InvalidOperationException("Book not found");

                var existingLike = await _context.Likes
                    .FirstOrDefaultAsync(l => l.BookId == bookId && l.UserId == userId);

                bool isLiked;
                int newLikesCount;

                if (existingLike != null)
                {
                    _context.Likes.Remove(existingLike);
                    newLikesCount = Math.Max(0, book.LikesCount - 1);
                    isLiked = false;
                }
                else
                {
                    _context.Likes.Add(new Like
                    {
                        BookId = bookId,
                        UserId = userId
                    });
                    newLikesCount = book.LikesCount + 1;
                    isLiked = true;
                }

                // ОПТИМІЗАЦІЯ: оновлюємо тільки LikesCount
                await _context.Books
                    .Where(b => b.Id == bookId)
                    .ExecuteUpdateAsync(s => s.SetProperty(b => b.LikesCount, newLikesCount));

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return new BookLikeResultDto
                {
                    LikesCount = newLikesCount,
                    IsLiked = isLiked
                };
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<List<BookDto>> GetLikedBooksAsync(string userId, string? currentUserId = null)
        {
            // ОПТИМІЗАЦІЯ: одним запитом отримуємо всі полайкані книги
            var likedBooks = await _context.Likes
                .AsNoTracking()
                .Where(l => l.UserId == userId)
                .Select(l => new
                {
                    l.BookId,
                    Book = new
                    {
                        l.Book.Id,
                        l.Book.Title,
                        l.Book.ImageUrl,
                        l.Book.Info,
                        l.Book.LikesCount,
                        Tags = l.Book.Tags.Select(bt => new { bt.Tag.Id, bt.Tag.Title }).ToList(),
                        Authors = l.Book.Authors.Select(ab => new { ab.Author.Id, ab.Author.Name }).ToList()
                    }
                })
                .ToListAsync();

            if (likedBooks.Count == 0)
                return new List<BookDto>();

            var bookDtos = likedBooks.Select(lb => new BookDto
            {
                Id = lb.Book.Id,
                Title = lb.Book.Title,
                ImageUrl = _fileService.GetFullUrl(lb.Book.ImageUrl),
                Info = lb.Book.Info,
                LikesCount = lb.Book.LikesCount,
                Tags = lb.Book.Tags.Select(t => new TagSimpleDto { Id = t.Id, Title = t.Title }).ToList(),
                Authors = lb.Book.Authors.Select(a => new AuthorSimpleDto { Id = a.Id, Name = a.Name }).ToList()
            }).ToList();

            // ОПТИМІЗАЦІЯ: один запит для перевірки лайків поточного користувача
            if (!string.IsNullOrEmpty(currentUserId))
            {
                var bookIds = bookDtos.Select(b => b.Id).ToList();
                var currentUserLikes = await _context.Likes
                    .Where(l => l.UserId == currentUserId && bookIds.Contains(l.BookId))
                    .Select(l => l.BookId)
                    .ToListAsync();

                var likedSet = new HashSet<int>(currentUserLikes);
                foreach (var dto in bookDtos)
                {
                    dto.IsLiked = likedSet.Contains(dto.Id);
                }
            }

            return bookDtos;
        }

        public async Task<List<int>> GetUserBookListIdsAsync(string userId, int bookId)
        {
            return await _context.BookListBooks
                .Where(blb => blb.BookList != null &&
                            blb.BookList.UserId == userId &&
                            blb.BookId == bookId &&
                            blb.BookListId != null)
                .Select(blb => blb.BookListId!.Value)
                .ToListAsync();
        }

        public async Task<FileResponse> GetBookFileAsync(int id)
        {
            // ОПТИМІЗАЦІЯ: завантажуємо тільки необхідні поля
            var book = await _context.Books
                .AsNoTracking()
                .Where(b => b.Id == id)
                .Select(b => new
                {
                    b.Id,
                    b.Title,
                    b.FileUrl,
                    Authors = b.Authors.Select(ab => ab.Author.Name).ToList()
                })
                .FirstOrDefaultAsync();

            if (book == null || string.IsNullOrWhiteSpace(book.FileUrl))
                throw new InvalidOperationException("Book or file not found");

            var authorNames = string.Join(", ", book.Authors);
            var safeFileName = $"{book.Title} ({authorNames})";

            return await _fileService.GetFileAsync(book.FileUrl, safeFileName);
        }

        // ПРИВАТНИЙ МЕТОД: оптимізована обробка тегів
        private async Task<List<int>> ProcessTagsAsync(List<int>? existingTagIds, List<string>? newTagTitles)
        {
            var allTagIds = new List<int>(existingTagIds ?? new List<int>());

            if (newTagTitles == null || newTagTitles.Count == 0)
                return allTagIds;

            var normalizedTitles = newTagTitles
                .Where(t => !string.IsNullOrWhiteSpace(t))
                .Select(t => t.Trim())
                .Distinct()
                .ToList();

            if (normalizedTitles.Count == 0)
                return allTagIds;

            // ОПТИМІЗАЦІЯ: одним запитом отримуємо всі існуючі теги
            var existingTags = await _context.Tags
                .Where(t => normalizedTitles.Contains(t.Title))
                .Select(t => new { t.Id, t.Title })
                .ToListAsync();

            var existingTagTitles = existingTags.Select(t => t.Title).ToHashSet();
            allTagIds.AddRange(existingTags.Select(t => t.Id));

            // Створюємо нові теги
            var newTags = normalizedTitles
                .Where(title => !existingTagTitles.Contains(title))
                .Select(title => new Tag { Title = title })
                .ToList();

            if (newTags.Count != 0)
            {
                _context.Tags.AddRange(newTags);
                await _context.SaveChangesAsync();
                allTagIds.AddRange(newTags.Select(t => t.Id));
            }

            return allTagIds;
        }
    }
}