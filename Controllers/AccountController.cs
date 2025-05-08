using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using api.Extensions;
using api.Mappers;
using api.Models.DTOs.Account;
using api.Models.Entities;
using api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Razor.Hosting;
using Microsoft.EntityFrameworkCore;

namespace api.Controllers
{
    [Route("api/account")]
    [ApiController]
    public class AccountController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly SignInManager<User> _signInManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly ITokenService _tokenService;
        // public async Task<User> CurrentUser () => await _userManager.FindByNameAsync(User.GetUsername());
        public AccountController(UserManager<User> userManager, ITokenService tokenService, SignInManager<User> signInManager, RoleManager<IdentityRole> roleManager)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _tokenService = tokenService;
            _signInManager = signInManager;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
        {
            try
            {
                if(!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var user = new User
                {
                    UserName = registerDto.UserName,
                    Email = registerDto.Email,
                };

                var createdUser = await _userManager.CreateAsync(user, registerDto.Password);

                if(createdUser.Succeeded)
                {
                    var roleResult = await _userManager.AddToRoleAsync(user, "User");
                    if(roleResult.Succeeded)
                    {
                        return Ok(
                            new NewUserDto
                            {
                                UserName = user.UserName,
                                Email = user.Email,
                                Token = await _tokenService.CreateTokenAsync(user),
                            }
                        );
                    }
                    else
                    {
                        return StatusCode(500, roleResult.Errors);
                    }
                }
                else
                {
                    return StatusCode(500, createdUser.Errors);
                }
            }
            catch (Exception e)
            {
                return StatusCode(500, e);
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto loginDto)
        {
            if(!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await _userManager.Users.FirstOrDefaultAsync(x => x.UserName == loginDto.UserName);

            if(user == null)
            {
                return Unauthorized("Invalid username!");
            }

            var result = await _signInManager.CheckPasswordSignInAsync(user, loginDto.Password, false);

            if(!result.Succeeded)
            {
                return Unauthorized("Username not found and/or password incorrect!");
            }

            return Ok(new NewUserDto
            {
                UserName = user.UserName,
                Email = user.Email,
                Token = await _tokenService.CreateTokenAsync(user),
            });
        }

        [HttpPut("edit/{id}")]
        [Authorize]
        public async Task<IActionResult> EditAsync([FromRoute] string id, [FromBody] UserUpdateDto userUpdateDto)
        {
            var userName = User.GetUsername();
            var currentUser = await _userManager.FindByNameAsync(userName);
            if(currentUser == null)
            {
                return BadRequest();
            }

            if(currentUser.Id != id && !User.IsInRole("Admin"))
            {
                return Forbid();
            }

            var user = await _userManager.FindByIdAsync(id);
            if(user == null)
            {
                return NotFound();
            }

            if (userUpdateDto.UserName is not null && await _userManager.Users.AnyAsync(u => u.UserName == userUpdateDto.UserName && u.Id != id))
            {
                return Conflict("Username is already taken.");
            }

            if(userUpdateDto.UserName is not null)
            {
                user.UserName = userUpdateDto.UserName;
            }

            if (userUpdateDto.Email is not null && await _userManager.Users.AnyAsync(u => u.Email == userUpdateDto.Email && u.Id != id))
            {
                return Conflict("Email is already in use.");
            }

            if(userUpdateDto.Email is not null)
            {
                user.Email = userUpdateDto.Email;
            }

            if(userUpdateDto.PhoneNumber is not null)
            {
                user.PhoneNumber = userUpdateDto.PhoneNumber;
            }

            if(userUpdateDto.About is not null)
            {
                user.About = userUpdateDto.About;
            }

            var result = await _userManager.UpdateAsync(user);
            return Ok(result);
        }

        [HttpDelete("delete/{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteAsync([FromRoute] string id)
        {
            var userName = User.GetUsername();
            var currentUser = await _userManager.FindByNameAsync(userName);
            if(currentUser == null)
            {
                return BadRequest();
            }

            if(currentUser.Id != id && !User.IsInRole("Admin"))
            {
                return Forbid();
            }

            var user = await _userManager.FindByIdAsync(id);
            if(user == null)
            {
                return NotFound();
            }
            var result = await _userManager.DeleteAsync(user);
            return Ok(result);
        }

        [HttpGet("users")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll()
        {
            var users = await _userManager.Users.ToListAsync();

            var userDtos = new List<UserDto>();
            foreach (var user in users)
            {
                userDtos.Add(await user.toUserDto(_userManager));
            }

            return Ok(userDtos);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById([FromRoute] string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) return NotFound();
            return Ok(await user.toUserDto(_userManager));
        }

        [HttpPost("set-role")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SetUserRole([FromBody] RoleUpdateDto dto)
        {
            var user = await _userManager.FindByIdAsync(dto.UserId);
            if (user == null)
                return NotFound();

            if (string.IsNullOrWhiteSpace(dto.NewRole))
                return BadRequest("NewRole is required.");

            if (!await _roleManager.RoleExistsAsync(dto.NewRole))
                return BadRequest("Specified role does not exist.");

            var currentRoles = await _userManager.GetRolesAsync(user);
            var resultRemove = await _userManager.RemoveFromRolesAsync(user, currentRoles);
            if (!resultRemove.Succeeded)
                return BadRequest(resultRemove.Errors);

            var resultAdd = await _userManager.AddToRoleAsync(user, dto.NewRole);
            if (!resultAdd.Succeeded)
                return BadRequest(resultAdd.Errors);

            return resultAdd.Succeeded ? Ok() : BadRequest(resultAdd.Errors);
        }
    }
}