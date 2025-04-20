using Microsoft.EntityFrameworkCore;
using MilLib.Models.Entities;

public class ApplicationDbContext : DbContext
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
                .HasOne(c => c.ReplyTo)
                .WithMany(c => c.Replies)
                .HasForeignKey(c => c.ReplyToId)
                .OnDelete(DeleteBehavior.NoAction);
        }
}