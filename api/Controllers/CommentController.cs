//api/Controllers/CommentController.cs
using api.Extensions;
using api.Models.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using MilLib.Models.DTOs.Comment;
using MilLib.Services.Interfaces;

namespace MilLib.Controllers
{
    [Route("api/[Controller]")]
    [ApiController]
    public class CommentController : ControllerBase
    {
        private readonly ICommentService _commentService;
        private readonly UserManager<User> _userManager;

        public CommentController(ICommentService commentService, UserManager<User> userManager)
        {
            _commentService = commentService;
            _userManager = userManager;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] CommentQueryObject query)
        {
            try
            {
                var result = await _commentService.GetAllCommentsAsync(query);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving comments", error = ex.Message });
            }
        }

        [HttpGet("book/{bookId}")]
        public async Task<IActionResult> GetCommentsForBook([FromRoute] int bookId)
        {
            try
            {
                var comments = await _commentService.GetCommentsForBookAsync(bookId);
                return Ok(comments);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving comments", error = ex.Message });
            }
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById([FromRoute] int id)
        {
            try
            {
                var comment = await _commentService.GetCommentByIdAsync(id);
                if (comment == null)
                    return NotFound(new { message = "Comment not found" });

                return Ok(comment);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving the comment", error = ex.Message });
            }
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> Create([FromBody] CommentCreateDto commentDto)
        {
            try
            {
                var username = User.GetUsername();
                var currentUser = await _userManager.FindByNameAsync(username);
                if (currentUser == null)
                    return Unauthorized(new { message = "User not found" });

                var comment = await _commentService.CreateCommentAsync(commentDto, currentUser.Id);
                return CreatedAtAction(nameof(GetById), new { id = comment.Id }, comment);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating the comment", error = ex.Message });
            }
        }

        [HttpPut("{id:int}")]
        [Authorize]
        public async Task<IActionResult> Update([FromRoute] int id, [FromBody] CommentUpdateDto commentDto)
        {
            try
            {
                var username = User.GetUsername();
                var currentUser = await _userManager.FindByNameAsync(username);
                if (currentUser == null)
                    return Unauthorized(new { message = "User not found" });

                var isAdmin = User.IsInRole("Admin");
                var comment = await _commentService.UpdateCommentAsync(id, commentDto, currentUser.Id, isAdmin);
                return Ok(comment);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                if (ex.Message.Contains("not found"))
                    return NotFound(new { message = ex.Message });
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating the comment", error = ex.Message });
            }
        }

        [HttpDelete("{id:int}")]
        [Authorize]
        public async Task<IActionResult> Delete([FromRoute] int id)
        {
            try
            {
                var username = User.GetUsername();
                var currentUser = await _userManager.FindByNameAsync(username);
                if (currentUser == null)
                    return Unauthorized(new { message = "User not found" });

                var isAdmin = User.IsInRole("Admin");
                await _commentService.DeleteCommentAsync(id, currentUser.Id, isAdmin);
                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid();
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while deleting the comment", error = ex.Message });
            }
        }
    }
}