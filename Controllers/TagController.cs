using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MilLib.Mappers;
using MilLib.Models.DTOs.Author;
using MilLib.Models.DTOs.Tag;
using MilLib.Models.Entities;
using MilLib.Services.Interfaces;
using MilLib.Repositories.Interfaces;

namespace MilLib.Controllers
{
    [Route("api/[Controller]")]
    [ApiController]
    public class TagController : ControllerBase
    {
        private readonly ITagRepository _tagRepository;
        private readonly IBookRepository _bookRepository;
        private readonly IFileService _fileService;
        
        public TagController(ITagRepository tagRepository, IBookRepository bookRepository, IFileService fileService)
        {
            _tagRepository = tagRepository;
            _bookRepository = bookRepository;
            _fileService = fileService;
        }
        
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var tags = await _tagRepository.GetAllWithBooksAsync();
            var res = tags.Select(a => a.toTagDto());
            return Ok(res);
        }
        
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById([FromRoute] int id)
        {
            var tag = await _tagRepository.GetByIdWithBooksAsync(id);
            if (tag == null)
            {
                return NotFound();
            }
            return Ok(tag.toTagDto());
        }
        
        [HttpPost]
        public async Task<IActionResult> Create([FromForm] TagCreateDto tagDto)
        {
            var tag = tagDto.toTagFromCreateDto();
            tag.ImageUrl = await _fileService.UploadAsync(tagDto.Image, "Tags/Images");
           
            var books = await _bookRepository.GetByIdsAsync(tagDto.BookIds);
            tag.Books = books.Select(t => new BookTag {Tag = tag, Book = t }).ToList();
            
            await _tagRepository.AddAsync(tag);
            await _tagRepository.SaveChangesAsync();
            
            return CreatedAtAction(nameof(GetById), new {id = tag.Id}, tag.toTagDto());
        }
        
        [HttpPut]
        [Route("{id}")]
        public async Task<IActionResult> Update([FromRoute] int id, [FromForm] TagUpdateDto tagDto)
        {
            var tag = await _tagRepository.GetByIdAsync(id);
            if (tag == null)
            {
                return NotFound();
            }
            
            tag.Title = tagDto.Title;
            tag.Info = tagDto.Info;
            
            if(tagDto.Image != null && tagDto.Image.Length > 0)
            {
                if(tag.ImageUrl != null)
                {
                    await _fileService.DeleteAsync(tag.ImageUrl);
                }
                tag.ImageUrl = await _fileService.UploadAsync(tagDto.Image, "Tags/Images");
            }
            
            var existingBookTags = await _tagRepository.GetBookTagsByTagIdAsync(tag.Id);
            await _tagRepository.RemoveBookTagsRangeAsync(existingBookTags);
            
            var books = await _bookRepository.GetByIdsAsync(tagDto.BookIds);
            tag.Books = books.Select(t => new BookTag {Tag = tag, Book = t }).ToList();
            
            await _tagRepository.UpdateAsync(tag);
            await _tagRepository.SaveChangesAsync();
            
            return Ok(tag.toTagDto());
        }
        
        [HttpDelete]
        [Route("{id}")]
        public async Task<IActionResult> Delete([FromRoute] int id)
        {
            var tag = await _tagRepository.GetByIdAsync(id);
            if (tag == null)
            {
                return NotFound();
            }
            
            await _tagRepository.DeleteAsync(tag);
            await _tagRepository.SaveChangesAsync();
            
            return NoContent();
        }
    }
}