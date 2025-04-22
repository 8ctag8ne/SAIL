using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MilLib.Models.DTOs.Book;
using MilLib.Models.Entities;

namespace MilLib.Mappers
{
    public static class BookMapper
    {
        public static BookDto toBookDto(this Book book)
        {
            return new BookDto
            {
                Id = book.Id,
                AuthorId = book.AuthorId,
                Title = book.Title,
                ImageUrl = book.ImageUrl,
                FileUrl = book.FileUrl,
                Info = book.Info,
                Tags = book.Tags.Select(bookTag => bookTag.Tag.toSimpleDto()).ToList(),
                Comments = book.Comments.Select(c => c.toCommentDto()).ToList(),
            };
        }
        public static BookSimpleDto toSimpleBookDto(this Book book)
        {
            return new BookSimpleDto
            {
                Id = book.Id,
                Title = book.Title,
                ImageUrl = book.ImageUrl
            };
        }

        public static Book toBookFromCreateDto(this BookCreateDto book)
        {
            return new Book
            {
                AuthorId = book.AuthorId,
                Title = book.Title,
                Info = book.Info,
            };
        }
    }
}