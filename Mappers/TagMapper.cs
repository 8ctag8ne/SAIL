using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MilLib.Models.DTOs.Tag;
using MilLib.Models.Entities;

namespace MilLib.Mappers
{
    public static class TagMapper
    {
        public static TagDto toTagDto(this Tag tag)
        {
            return new TagDto
            {
                Id = tag.Id,
                Title = tag.Title,
                ImageUrl = tag.ImageUrl,
                Info = tag.Info,
                Books = tag.Books.Select(bt => bt.Book.toSimpleBookDto()).ToList(),
            };
        }

        public static TagSimpleDto toSimpleDto(this Tag tag)
        {
            return new TagSimpleDto
            {
                Id = tag.Id,
                Title = tag.Title
            };
        }

        public static TagSimpleDto toTagSimpleDto(this BookTag bookTag)
        {
            return new TagSimpleDto
            {
                Id = bookTag.TagId,
                Title = bookTag.Tag.Title,
            };
        }

        public static Tag toTagFromCreateDto(this TagCreateDto tag)
        {
            return new Tag
            {
                Title = tag.Title,
                Info = tag.Info,
            };
        }
    }
}