//api/Services/Implementations/TagService.cs
using api.Models.Entities;
using Microsoft.EntityFrameworkCore;
using MilLib.Helpers;
using MilLib.Models.DTOs.Book;
using MilLib.Models.DTOs.Tag;
using MilLib.Models.Entities;
using MilLib.Services.Interfaces;

namespace MilLib.Services.Implementations
{
    public class TagService : ITagService
    {
        private readonly ApplicationDbContext _context;
        private readonly IFileService _fileService;

        public TagService(ApplicationDbContext context, IFileService fileService)
        {
            _context = context;
            _fileService = fileService;
        }

        public async Task<PaginatedResult<TagDto>> GetAllTagsAsync(TagQueryObject query)
        {
            var tagsQuery = _context.Tags.AsQueryable();

            // Фільтрація
            if (!string.IsNullOrEmpty(query.Title))
            {
                tagsQuery = tagsQuery.Where(t => t.Title.Contains(query.Title));
            }

            // Сортування
            if (!string.IsNullOrEmpty(query.SortBy))
            {
                tagsQuery = query.SortBy.ToLower() switch
                {
                    "title" => query.IsDescenging
                        ? tagsQuery.OrderByDescending(t => t.Title)
                        : tagsQuery.OrderBy(t => t.Title),
                    _ => tagsQuery.OrderByDescending(t => t.Id)
                };
            }
            else
            {
                tagsQuery = tagsQuery.OrderByDescending(t => t.Id);
            }

            var totalItems = await tagsQuery.CountAsync();
            var totalPages = (int)Math.Ceiling(totalItems / (double)query.PageSize);
            var currentPage = Math.Clamp(query.PageNumber, 1, totalPages > 0 ? totalPages : 1);

            // ОПТИМІЗАЦІЯ: для списку завантажуємо тільки базову інформацію + кількість книг
            var tags = await tagsQuery
                .AsNoTracking()
                .Skip(query.PageSize * (currentPage - 1))
                .Take(query.PageSize)
                .Select(t => new
                {
                    t.Id,
                    t.Title,
                    t.Info,
                    t.ImageUrl,
                    BooksCount = t.Books.Count()
                })
                .ToListAsync();

            var tagDtos = tags.Select(t => new TagDto
            {
                Id = t.Id,
                Title = t.Title,
                Info = t.Info,
                ImageUrl = t.ImageUrl,
                // Books = new List<BookSimpleDto>(), // Порожній список для оптимізації
                BooksCount = t.BooksCount
            }).ToList();

            return new PaginatedResult<TagDto>
            {
                Items = tagDtos,
                TotalItems = totalItems,
                TotalPages = totalPages,
                CurrentPage = currentPage
            };
        }

        public async Task<TagDto?> GetTagByIdAsync(int id)
        {
            // ОПТИМІЗАЦІЯ: завантажуємо тільки потрібні поля книг
            var tag = await _context.Tags
                .AsNoTracking()
                .Where(t => t.Id == id)
                .Select(t => new
                {
                    t.Id,
                    t.Title,
                    t.Info,
                    t.ImageUrl,
                    Books = t.Books.Select(bt => new
                    {
                        bt.Book.Id,
                        bt.Book.Title,
                        bt.Book.ImageUrl,
                        bt.Book.Info
                    }).ToList()
                })
                .FirstOrDefaultAsync();

            if (tag == null) return null;

            return new TagDto
            {
                Id = tag.Id,
                Title = tag.Title,
                Info = tag.Info,
                ImageUrl = tag.ImageUrl,
                Books = tag.Books.Select(b => new BookSimpleDto
                {
                    Id = b.Id,
                    Title = b.Title,
                    ImageUrl = b.ImageUrl,
                }).ToList(),
                BooksCount = tag.Books.Count
            };
        }

        public async Task<TagDto> CreateTagAsync(TagCreateDto tagDto)
        {
            // Валідація унікальності назви
            if (await _context.Tags.AnyAsync(t => t.Title == tagDto.Title))
                throw new InvalidOperationException("Tag with this title already exists");

            // Валідація книг
            if (tagDto.BookIds != null && tagDto.BookIds.Any())
            {
                var existingBookIds = await _context.Books
                    .Where(b => tagDto.BookIds.Contains(b.Id))
                    .Select(b => b.Id)
                    .ToListAsync();

                var missingBookIds = tagDto.BookIds.Except(existingBookIds).ToList();
                if (missingBookIds.Any())
                    throw new InvalidOperationException($"Books not found: {string.Join(", ", missingBookIds)}");
            }

            // Завантаження зображення
            string? imageUrl = null;
            if (tagDto.Image != null && tagDto.Image.Length > 0)
            {
                imageUrl = await _fileService.UploadAsync(tagDto.Image, "Tags/Images");
            }

            // Створення тегу
            var tag = new Tag
            {
                Title = tagDto.Title,
                Info = tagDto.Info,
                ImageUrl = imageUrl
            };

            _context.Tags.Add(tag);

            // ОПТИМІЗАЦІЯ: додаємо зв'язки без завантаження повних сутностей книг
            if (tagDto.BookIds != null && tagDto.BookIds.Any())
            {
                var bookTags = tagDto.BookIds.Select(bookId => new BookTag
                {
                    Tag = tag,
                    BookId = bookId
                }).ToList();

                _context.BookTags.AddRange(bookTags);
            }

            await _context.SaveChangesAsync();

            // Повертаємо створений тег
            return await GetTagByIdAsync(tag.Id) ?? throw new InvalidOperationException("Failed to retrieve created tag");
        }

        public async Task<TagDto> UpdateTagAsync(int id, TagUpdateDto tagDto)
        {
            // ОПТИМІЗАЦІЯ: завантажуємо тільки необхідні дані
            var tag = await _context.Tags
                .Where(t => t.Id == id)
                .Select(t => new { t.Id, t.Title, t.ImageUrl })
                .FirstOrDefaultAsync();

            if (tag == null)
                throw new InvalidOperationException("Tag not found");

            // Валідація унікальності назви (якщо змінюється)
            if (!string.IsNullOrEmpty(tagDto.Title) && tag.Title != tagDto.Title)
            {
                if (await _context.Tags.AnyAsync(t => t.Title == tagDto.Title))
                    throw new InvalidOperationException("Tag with this title already exists");
            }

            // Валідація книг
            if (tagDto.BookIds != null && tagDto.BookIds.Any())
            {
                var existingBookIds = await _context.Books
                    .Where(b => tagDto.BookIds.Contains(b.Id))
                    .Select(b => b.Id)
                    .ToListAsync();

                var missingBookIds = tagDto.BookIds.Except(existingBookIds).ToList();
                if (missingBookIds.Any())
                    throw new InvalidOperationException($"Books not found: {string.Join(", ", missingBookIds)}");
            }

            // Обробка зображення
            string? newImageUrl = tag.ImageUrl;
            if (tagDto.Image != null && tagDto.Image.Length > 0)
            {
                if (!string.IsNullOrEmpty(tag.ImageUrl))
                    await _fileService.DeleteAsync(tag.ImageUrl);
                newImageUrl = await _fileService.UploadAsync(tagDto.Image, "Tags/Images");
            }

            // ОПТИМІЗАЦІЯ: оновлюємо тільки змінені поля через ExecuteUpdateAsync
            await _context.Tags
                .Where(t => t.Id == id)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(t => t.Title, tagDto.Title ?? tag.Title)
                    .SetProperty(t => t.Info, tagDto.Info)
                    .SetProperty(t => t.ImageUrl, newImageUrl));

            // ОПТИМІЗАЦІЯ: оновлюємо зв'язки одним батчем
            if (tagDto.BookIds != null)
            {
                // Видаляємо старі зв'язки
                await _context.BookTags
                    .Where(bt => bt.TagId == id)
                    .ExecuteDeleteAsync();

                // Додаємо нові зв'язки (якщо є)
                if (tagDto.BookIds.Any())
                {
                    var newBookTags = tagDto.BookIds.Select(bookId => new BookTag
                    {
                        TagId = id,
                        BookId = bookId
                    }).ToList();

                    _context.BookTags.AddRange(newBookTags);
                    await _context.SaveChangesAsync();
                }
            }

            // Повертаємо оновлений тег
            return await GetTagByIdAsync(id) ?? throw new InvalidOperationException("Failed to retrieve updated tag");
        }

        public async Task DeleteTagAsync(int id)
        {
            // ОПТИМІЗАЦІЯ: завантажуємо тільки ImageUrl для видалення файлу
            var tag = await _context.Tags
                .Where(t => t.Id == id)
                .Select(t => new { t.Id, t.ImageUrl })
                .FirstOrDefaultAsync();

            if (tag == null)
                throw new InvalidOperationException("Tag not found");

            // Видаляємо зображення
            if (!string.IsNullOrEmpty(tag.ImageUrl))
                await _fileService.DeleteAsync(tag.ImageUrl);

            // ОПТИМІЗАЦІЯ: видаляємо зв'язки одним запитом
            await _context.BookTags
                .Where(bt => bt.TagId == id)
                .ExecuteDeleteAsync();

            // Видаляємо тег
            _context.Tags.Remove(new Tag { Id = tag.Id });
            await _context.SaveChangesAsync();
        }
        public async Task<IEnumerable<TagSimpleDto>> GetAllSimpleAsync()
        {
            var simpleTags = _context.Tags.AsNoTracking().Select(t => new TagSimpleDto
            {
                Id = t.Id,
                Title = t.Title,
            });

            return await simpleTags.ToListAsync();
        }
    }
}