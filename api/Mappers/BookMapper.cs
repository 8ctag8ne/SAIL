using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using api.Models.DTOs.Book;
using MilLib.Models.DTOs.Book;
using MilLib.Models.Entities;

namespace MilLib.Mappers
{
    public static class BookMapper
    {
        public static BookDto toBookDto(this Book book, bool isLiked = false)
        {
            return new BookDto
            {
                Id = book.Id,
                Title = book.Title,
                ImageUrl = book.ImageUrl,
                FileUrl = book.FileUrl,
                Info = book.Info,
                LikesCount = book.LikesCount,
                IsLiked = isLiked,
                Tags = book.Tags.Select(bookTag => bookTag.Tag.toSimpleDto()).ToList(),
                Comments = book.Comments.Select(c => c.toCommentDto()).ToList(),
                Authors = book.Authors.Select(ab => ab.Author.toSimpleDto()).ToList(),
            };
        }
        public static BookDescriptiveDto toDescriptiveDto(this Book book, bool isLiked = false)
        {
            return new BookDescriptiveDto
            {
                Id = book.Id,
                Title = book.Title,
                Info = book.Info,
                LikesCount = book.LikesCount,
                Tags = book.Tags.Select(bookTag => bookTag.Tag.toSimpleDto()).ToList(),
                Authors = book.Authors.Select(ab => ab.Author.toSimpleDto()).ToList(),
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
                Title = book.Title,
                Info = book.Info,
                LikesCount = 0,
            };
        }
    }
}