using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MilLib.Models.DTOs.Book;
using MilLib.Models.DTOs.Comment;
using MilLib.Models.Entities;

namespace MilLib.Mappers
{
    public static class CommentMapper
    {
        public static CommentDto toCommentDto(this Comment Comment)
        {
            return new CommentDto
            {
                Id = Comment.Id,
                CreatedAt = Comment.CreatedAt,
                Content = Comment.Content,
                BookId = Comment.BookId,
                ReplyToId = Comment.ReplyToId,
                Replies = Comment.Replies.Select(c => c.toCommentSimpleDto()).ToList(),
            };
        }

        public static Comment toCommentFromCreateDto(this CommentCreateDto Comment)
        {
            return new Comment
            {
                CreatedAt = Comment.CreatedAt,
                Content = Comment.Content,
                BookId = Comment.BookId,
                ReplyToId = Comment.ReplyToId,
            };
        }
        public static CommentSimpleDto toCommentSimpleDto(this Comment Comment)
        {
            return new CommentSimpleDto
            {
                Id = Comment.Id,
                CreatedAt = Comment.CreatedAt,
                Content = Comment.Content,
                BookId = Comment.BookId,
                ReplyToId = Comment.ReplyToId,
            };
        }
    }
}