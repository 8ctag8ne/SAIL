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
using MilLib.Services.Interfaces;

namespace MilLib.Controllers
{
    [Route("api/[Controller]")]
    [ApiController]
    public class CommentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IFileService _fileService;
        public CommentController(ApplicationDbContext context, IFileService fileService)
        {
            _context = context;
            _fileService = fileService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var Comments = await _context.Comments.Include(a => a.Replies).ToListAsync();
            var res = Comments.Select(a => a.toCommentDto());
            return Ok(res);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById([FromRoute] int id)
        {
            var Comment  = await _context.Comments.Include(a => a.Replies).FirstOrDefaultAsync(a => a.Id == id);
            if (Comment == null)
            {
                return NotFound();
            }
            return Ok(Comment.toCommentDto());
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CommentCreateDto CommentDto)
        {
            var Comment = CommentDto.toCommentFromCreateDto();
            _context.Comments.Add(Comment);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new {id = Comment.Id}, Comment.toCommentDto());
        }

        [HttpPut]
        [Route("{id}")]
        public async Task<IActionResult> Update([FromRoute] int id, [FromBody] CommentUpdateDto CommentDto)
        {
            var Comment = await _context.Comments.FindAsync(id);
            if (Comment == null)
            {
                return NotFound();
            }
            Comment.Content = CommentDto.Content;

            _context.Comments.Update(Comment);
            await _context.SaveChangesAsync();

            return Ok(Comment.toCommentDto());
        }

        [HttpDelete]
        [Route("{id}")]
        public async Task<IActionResult> Delete([FromRoute] int id)
        {
            var Comment = await _context.Comments.FindAsync(id);
            if (Comment == null)
            {
                return NotFound();
            }

            var replies = await _context.Comments
                .Where(c => c.ReplyToId == Comment.Id)
                .ToListAsync();

            foreach (var reply in replies)
            {
                reply.ReplyToId = null;
            }
            _context.Comments.UpdateRange(replies);

            _context.Comments.Remove(Comment);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        
    }
}