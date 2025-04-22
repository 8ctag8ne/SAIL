using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MilLib.Models.DTOs.BookList;
using MilLib.Models.Entities;

namespace MilLib.Mappers
{
    public static class BookListMapper
    {
        public static BookListDto toBookListDto(this BookList bookList)
        {
            return new BookListDto
            {
                Id = bookList.Id,
                Title = bookList.Title,
                Description = bookList.Description,
                IsPrivate = bookList.IsPrivate,
                Books = bookList.Books.Select(b => b.Book.toSimpleBookDto()).ToList(),
            };
        }

        public static BookList toBookListFromCreateDto(this BookListCreateDto bookList)
        {
            return new BookList
            {
                Title = bookList.Title,
                Description = bookList.Description,
                IsPrivate = bookList.IsPrivate
            };
        }
    }
}