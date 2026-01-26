//api/Controllers/TagController.cs
using Microsoft.AspNetCore.Mvc;
using MilLib.Models.DTOs.Tag;
using MilLib.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using MilLib.Helpers;

namespace MilLib.Controllers
{
    [Route("api/[Controller]")]
    [ApiController]
    public class TagController : ControllerBase
    {
        private readonly ITagService _tagService;

        public TagController(ITagService tagService)
        {
            _tagService = tagService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] TagQueryObject query)
        {
            try
            {
                var result = await _tagService.GetAllTagsAsync(query);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving tags", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById([FromRoute] int id)
        {
            try
            {
                var tag = await _tagService.GetTagByIdAsync(id);
                if (tag == null)
                    return NotFound(new { message = "Tag not found" });

                return Ok(tag);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while retrieving the tag", error = ex.Message });
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin,Librarian")]
        public async Task<IActionResult> Create([FromForm] TagCreateDto tagDto)
        {
            try
            {
                var tag = await _tagService.CreateTagAsync(tagDto);
                return CreatedAtAction(nameof(GetById), new { id = tag.Id }, tag);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while creating the tag", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin,Librarian")]
        public async Task<IActionResult> Update([FromRoute] int id, [FromForm] TagUpdateDto tagDto)
        {
            try
            {
                var tag = await _tagService.UpdateTagAsync(id, tagDto);
                return Ok(tag);
            }
            catch (InvalidOperationException ex)
            {
                if (ex.Message.Contains("not found"))
                    return NotFound(new { message = ex.Message });
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while updating the tag", error = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin,Librarian")]
        public async Task<IActionResult> Delete([FromRoute] int id)
        {
            try
            {
                await _tagService.DeleteTagAsync(id);
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while deleting the tag", error = ex.Message });
            }
        }
    }
}