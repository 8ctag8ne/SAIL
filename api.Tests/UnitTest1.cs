using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using MilLib.Controllers;
using MilLib.Helpers;
using MilLib.Models.DTOs.Book;
using MilLib.Models.Entities;
using MilLib.Repositories.Interfaces;
using MilLib.Services.Interfaces;
using Moq;
using NUnit.Framework;
using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace MilLib.Tests
{
    [TestFixture]
    public class BookControllerTests
    {
        private Mock<IBookRepository> _mockBookRepository;
        private Mock<IFileService> _mockFileService;
        private BookController _controller;
        private Book _testBook;
        private BookCreateDto _testBookCreateDto;
        private Mock<IFormFile> _mockImageFile;
        private Mock<IFormFile> _mockPdfFile;

        [SetUp]
        public void Setup()
        {
            // Initialize mocks
            _mockBookRepository = new Mock<IBookRepository>(MockBehavior.Strict);
            _mockFileService = new Mock<IFileService>(MockBehavior.Strict);
            
            // Create test book
            _testBook = new Book
            {
                Id = 1,
                Title = "Test Book",
                Info = "Test Info",
                AuthorId = 1,
                ImageUrl = "/Books/Images/test-image.jpg",
                FileUrl = "/Books/Files/test-file.pdf",
                Tags = new List<BookTag>()
            };

            // Setup mock files
            _mockImageFile = new Mock<IFormFile>();
            _mockPdfFile = new Mock<IFormFile>();
            
            // Setup mock files
            var imageContent = "Fake Image Content";
            var imageStream = new MemoryStream(Encoding.UTF8.GetBytes(imageContent));
            _mockImageFile.Setup(f => f.Length).Returns(imageStream.Length);
            _mockImageFile.Setup(f => f.FileName).Returns("test-image.jpg");
            _mockImageFile.Setup(f => f.OpenReadStream()).Returns(imageStream);
            _mockImageFile.Setup(f => f.CopyToAsync(It.IsAny<Stream>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            var pdfContent = "Fake PDF Content";
            var pdfStream = new MemoryStream(Encoding.UTF8.GetBytes(pdfContent));
            _mockPdfFile.Setup(f => f.Length).Returns(pdfStream.Length);
            _mockPdfFile.Setup(f => f.FileName).Returns("test-file.pdf");
            _mockPdfFile.Setup(f => f.OpenReadStream()).Returns(pdfStream);
            _mockPdfFile.Setup(f => f.CopyToAsync(It.IsAny<Stream>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            _testBookCreateDto = new BookCreateDto
            {
                Title = "New Test Book",
                Info = "New Test Info",
                AuthorId = 1,
                TagIds = new List<int> { 1, 2 },
                Image = _mockImageFile.Object,
                File = _mockPdfFile.Object
            };

            // Create controller
            _controller = new BookController(_mockBookRepository.Object, _mockFileService.Object);
        }

        [Test]
        public async Task Create_SequentialCalls_OrderVerification()
        {
            // Arrange - Sequential responses for multiple calls
            var sequence = new MockSequence();
            
            _mockBookRepository.InSequence(sequence)
                .Setup(repo => repo.AuthorExistsAsync(_testBookCreateDto.AuthorId))
                .ReturnsAsync(true);
            
            _mockBookRepository.InSequence(sequence)
                .Setup(repo => repo.TitleExistsAsync(_testBookCreateDto.Title))
                .ReturnsAsync(false);
            
            _mockFileService.Setup(fs => fs.UploadAsync(
                    It.Is<IFormFile>(f => f.FileName == "test-image.jpg"), 
                    "Books/Images"))
                .ReturnsAsync("/Books/Images/guid_test-image.jpg");
            
            _mockFileService.Setup(fs => fs.UploadAsync(
                    It.Is<IFormFile>(f => f.FileName == "test-file.pdf"), 
                    "Books/Files"))
                .ReturnsAsync("/Books/Files/guid_test-file.pdf");
            
            _mockBookRepository.Setup(repo => repo.AddAsync(It.IsAny<Book>(), It.IsAny<List<int>>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _controller.Create(_testBookCreateDto);

            // Assert
            Assert.That(result, Is.InstanceOf<CreatedAtActionResult>());
            
            // Verify method call order and count
            _mockBookRepository.Verify(repo => repo.AuthorExistsAsync(_testBookCreateDto.AuthorId), Times.Once);
            _mockBookRepository.Verify(repo => repo.TitleExistsAsync(_testBookCreateDto.Title), Times.Once);
            _mockFileService.Verify(fs => fs.UploadAsync(It.IsAny<IFormFile>(), "Books/Images"), Times.Once);
            _mockFileService.Verify(fs => fs.UploadAsync(It.IsAny<IFormFile>(), "Books/Files"), Times.Once);
            _mockBookRepository.Verify(repo => repo.AddAsync(It.IsAny<Book>(), It.IsAny<List<int>>()), Times.Once);
        }

        [Test]
        public async Task Create_WithNonexistentAuthor_ReturnsBadRequest()
        {
            // Arrange
            _mockBookRepository.Setup(repo => repo.AuthorExistsAsync(_testBookCreateDto.AuthorId))
                .ReturnsAsync(false);

            // Act
            var result = await _controller.Create(_testBookCreateDto);

            // Assert
            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
            var badRequestResult = result as BadRequestObjectResult;
            Assert.That("Author does not exist" == badRequestResult.Value);
            
            // Verify only the first method was called
            _mockBookRepository.Verify(repo => repo.AuthorExistsAsync(_testBookCreateDto.AuthorId), Times.Once);
            _mockBookRepository.Verify(repo => repo.TitleExistsAsync(It.IsAny<string>()), Times.Never);
        }

        [Test]
        public async Task Create_FileServiceThrowsException_ExceptionIsPropagated()
        {
            // Arrange
            _mockBookRepository.Setup(repo => repo.AuthorExistsAsync(_testBookCreateDto.AuthorId))
                .ReturnsAsync(true);
            
            _mockBookRepository.Setup(repo => repo.TitleExistsAsync(_testBookCreateDto.Title))
                .ReturnsAsync(false);
            
            // Setup mock to throw exception
            _mockFileService.Setup(fs => fs.UploadAsync(It.IsAny<IFormFile>(), "Books/Images"))
                .ThrowsAsync(new FileServiceException("Test file service exception"));

            // Act & Assert
            var ex = Assert.ThrowsAsync<FileServiceException>(async () => 
                await _controller.Create(_testBookCreateDto));
            
            Assert.That("Test file service exception" == ex.Message);
            
            // Verify calls
            _mockBookRepository.Verify(repo => repo.AddAsync(It.IsAny<Book>(), It.IsAny<List<int>>()), Times.Never);
        }

        [Test]
        public async Task GetById_ComplexParameterMatching()
        {
            // Arrange
            int validId = 1;
            int invalidId = 999;
            
            // Setup with parameter matching for different behaviors
            _mockBookRepository.Setup(repo => repo.GetByIdWithDetailsAsync(It.Is<int>(id => id == validId)))
                .ReturnsAsync(_testBook);
            
            _mockBookRepository.Setup(repo => repo.GetByIdWithDetailsAsync(It.Is<int>(id => id != validId)))
                .ReturnsAsync((Book)null);

            // Act & Assert - First call with valid ID
            var validResult = await _controller.GetById(validId);
            Assert.That(validResult, Is.InstanceOf<OkObjectResult>());
            
            // Second call with invalid ID
            var invalidResult = await _controller.GetById(invalidId);
            Assert.That(invalidResult, Is.InstanceOf<NotFoundResult>());
            
            // Verify calls
            _mockBookRepository.Verify(repo => repo.GetByIdWithDetailsAsync(validId), Times.Once);
            _mockBookRepository.Verify(repo => repo.GetByIdWithDetailsAsync(invalidId), Times.Once);
        }

        [Test]
        public async Task Delete_DifferentResponsesForConsecutiveCalls()
        {
            // Arrange - Setup for different responses on consecutive calls
            int bookId = 1;
            var callCount = 0;
            
            _mockBookRepository.Setup(repo => repo.GetByIdAsync(bookId))
                .Returns(() => {
                    callCount++;
                    if (callCount == 1)
                        return Task.FromResult(_testBook); // First call returns book
                    else
                        return Task.FromResult<Book>(null); // Second call returns null
                });
            
            _mockBookRepository.Setup(repo => repo.DeleteAsync(It.IsAny<Book>()))
                .Returns(Task.CompletedTask);

            // Act & Assert - First call should succeed
            var firstResult = await _controller.Delete(bookId);
            Assert.That(firstResult, Is.InstanceOf<NoContentResult>());
            
            // Second call should fail
            var secondResult = await _controller.Delete(bookId);
            Assert.That(secondResult, Is.InstanceOf<NotFoundResult>());
            
            // Verify calls
            _mockBookRepository.Verify(repo => repo.GetByIdAsync(bookId), Times.Exactly(2));
            _mockBookRepository.Verify(repo => repo.DeleteAsync(It.IsAny<Book>()), Times.Once);
        }
    }
}