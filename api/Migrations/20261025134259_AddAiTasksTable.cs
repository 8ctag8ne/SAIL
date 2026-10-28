using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace api.Migrations
{
    /// <inheritdoc />
    public partial class AddAiTasksTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                CREATE TABLE IF NOT EXISTS ai_tasks (
                    id character varying(64) NOT NULL,
                    task_type character varying(50) NOT NULL,
                    status character varying(20) NOT NULL,
                    book_id integer NULL,
                    result jsonb NULL,
                    error text NULL,
                    created_at timestamp with time zone NOT NULL DEFAULT now(),
                    updated_at timestamp with time zone NOT NULL DEFAULT now(),
                    CONSTRAINT pk_ai_tasks PRIMARY KEY (id)
                );

                CREATE INDEX IF NOT EXISTS ix_ai_tasks_status_created_at ON ai_tasks (status, created_at);

                ALTER TABLE IF EXISTS ai_tasks ENABLE ROW LEVEL SECURITY;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP TABLE IF EXISTS ai_tasks;");
        }
    }
}
