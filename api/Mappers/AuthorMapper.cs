using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization.Infrastructure;
using MilLib.Models.DTOs.Author;
using MilLib.Models.Entities;

namespace MilLib.Mappers
{
    public static class AuthorMapper
    {
        public static AuthorDto toAuthorDto(this Author author)
        {
            return new AuthorDto
            {
                Id = author.Id,
                Name = author.Name,
                ImageUrl = author.ImageUrl,
                Info = author.Info,
                Books = author.Books.Select(ab => ab.Book.toSimpleBookDto()).ToList(),
            };
        }
        public static AuthorSimpleDto toSimpleDto(this Author author)
        {
            return new AuthorSimpleDto
            {
                Id = author.Id,
                Name = author.Name,
            };
        }

        public static Author toAuthorFromCreateDto(this AuthorCreateDto author)
        {
            return new Author
            {
                Name = author.Name,
                Info = author.Info,
            };
        }
    }
}