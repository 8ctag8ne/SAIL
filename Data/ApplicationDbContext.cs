using api.Models.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using MilLib.Models.Entities;

public class ApplicationDbContext : IdentityDbContext<User>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options) { }

    public DbSet<Book> Books { get; set; }
    public DbSet<Author> Authors { get; set; }
    public DbSet<Tag> Tags { get; set; }
    public DbSet<BookTag> BookTags {get; set;}
    public DbSet<BookList> BookLists {get; set;}
    public DbSet<BookListBook> BookListBooks {get; set;}
    public DbSet<Comment> Comments {get; set;}
    public DbSet<Like> Likes {get; set;}

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Book>()
            .HasOne(b => b.Author)
            .WithMany(a => a.Books)
            .HasForeignKey(b => b.AuthorId);

        modelBuilder.Entity<BookTag>()
            .HasKey(bt => new { bt.BookId, bt.TagId });

        modelBuilder.Entity<BookTag>()
            .HasOne(bt => bt.Book)
            .WithMany(b => b.Tags)
            .HasForeignKey(bt => bt.BookId);

        modelBuilder.Entity<BookTag>()
            .HasOne(bt => bt.Tag)
            .WithMany(t => t.Books)
            .HasForeignKey(bt => bt.TagId);

        modelBuilder.Entity<BookListBook>()
            .HasKey(bl => new { bl.BookId, bl.BookListId });

        modelBuilder.Entity<BookListBook>()
            .HasOne(bt => bt.BookList)
            .WithMany(b => b.Books)
            .HasForeignKey(bt => bt.BookListId);

        modelBuilder.Entity<BookListBook>()
            .HasOne(bt => bt.Book)
            .WithMany(t => t.BookLists)
            .HasForeignKey(bt => bt.BookId);

        modelBuilder.Entity<Comment>()
            .HasOne(c => c.Book)
            .WithMany(b => b.Comments)
            .HasForeignKey(c => c.BookId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Comment>()
            .HasOne(c => c.User)
            .WithMany(u => u.Comments)
            .HasForeignKey(c => c.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Comment>()
            .HasOne(c => c.ReplyTo)
            .WithMany(c => c.Replies)
            .HasForeignKey(c => c.ReplyToId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<Like>()
            .HasKey(l => new { l.BookId, l.UserId });

        modelBuilder.Entity<Like>()
            .HasOne(l => l.Book)
            .WithMany(b => b.Likes)
            .HasForeignKey(l => l.BookId);

        modelBuilder.Entity<Like>()
            .HasOne(l => l.User)
            .WithMany(b => b.Likes)
            .HasForeignKey(l => l.UserId);


        List<IdentityRole> roles = new List<IdentityRole>
        {
            new IdentityRole
            {
                Name = "Admin",
                NormalizedName = "ADMIN",
            },
            new IdentityRole
            {
                Name = "Librarian",
                NormalizedName = "LIBRARIAN",
            },
            new IdentityRole
            {
                Name = "User",
                NormalizedName = "USER",
            },
        };
        modelBuilder.Entity<IdentityRole>().HasData(roles);
    }
}