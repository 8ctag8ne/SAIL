using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MilLib.Mappers;
using MilLib.Models.DTOs.Book;
using MilLib.Models.DTOs.Comment;
using MilLib.Models.Entities;
using MilLib.Repositories.Interfaces;

namespace MilLib.Controllers
{
    [Route("api/[Controller]")]
    [ApiController]
    public class CommentController : ControllerBase
    {
        private readonly ICommentRepository _commentRepository;
        private readonly IBookRepository _bookRepository;

        public CommentController(ICommentRepository commentRepository, IBookRepository bookRepository)
        {
            _commentRepository = commentRepository;
            _bookRepository = bookRepository;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var comments = await _commentRepository.GetAllWithRepliesAsync();
            var res = comments.Select(a => a.toCommentDto());
            return Ok(res);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById([FromRoute] int id)
        {
            var comment = await _commentRepository.GetByIdWithRepliesAsync(id);
            if (comment == null)
            {
                return NotFound();
            }
            return Ok(comment.toCommentDto());
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CommentCreateDto commentDto)
        {
            var book = await _bookRepository.GetByIdAsync(commentDto.BookId);
            if (book == null)
            {
                return BadRequest($"Book with id {commentDto.BookId} doesn't exists");
            }
            
            if(commentDto.ReplyToId != null)
            {
                var parent = await _commentRepository.GetByIdAsync(commentDto.ReplyToId.Value);
                if (parent == null)
                {
                    return BadRequest($"Comment with id {commentDto.ReplyToId} to reply to doesn't exists");
                }
            }
            
            var comment = commentDto.toCommentFromCreateDto();
            await _commentRepository.AddAsync(comment);
            await _commentRepository.SaveChangesAsync();
            
            return CreatedAtAction(nameof(GetById), new {id = comment.Id}, comment.toCommentDto());
        }

        [HttpPut]
        [Route("{id:int}")]
        public async Task<IActionResult> Update([FromRoute] int id, [FromBody] CommentUpdateDto commentDto)
        {
            var comment = await _commentRepository.GetByIdAsync(id);
            if (comment == null)
            {
                return NotFound();
            }
            
            if(!commentDto.Content.IsNullOrEmpty())
            {
                comment.Content = commentDto.Content;
            }

            await _commentRepository.UpdateAsync(comment);
            await _commentRepository.SaveChangesAsync();

            return Ok(comment.toCommentDto());
        }

        [HttpDelete]
        [Route("{id:int}")]
        public async Task<IActionResult> Delete([FromRoute] int id)
        {
            var comment = await _commentRepository.GetByIdAsync(id);
            if (comment == null)
            {
                return NotFound();
            }

            var replies = await _commentRepository.GetRepliesForCommentAsync(id);
            
            foreach (var reply in replies)
            {
                reply.ReplyToId = null;
            }
            await _commentRepository.UpdateRangeAsync(replies);

            await _commentRepository.DeleteAsync(comment);
            await _commentRepository.SaveChangesAsync();

            return NoContent();
        }
    }
}