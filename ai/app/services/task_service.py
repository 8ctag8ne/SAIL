from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.models import AITask
from app.db.database import AsyncSessionLocal

class TaskService:
    @staticmethod
    async def create_task(
        task_id: str,
        task_type: str,
        book_id: Optional[int] = None,
        status: str = "processing"
    ) -> AITask:
        """Створює запис задачі в PostgreSQL зі статусом processing/pending."""
        async with AsyncSessionLocal() as session:
            task = AITask(
                id=task_id,
                task_type=task_type,
                book_id=book_id,
                status=status,
                result={},
                error=None
            )
            session.add(task)
            await session.commit()
            return task

    @staticmethod
    async def update_task(
        task_id: str,
        status: str,
        result: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None
    ) -> None:
        """Оновлює стан задачі та записує результати виконання або помилку."""
        async with AsyncSessionLocal() as session:
            res = await session.execute(select(AITask).where(AITask.id == task_id))
            task = res.scalar_one_or_none()
            if task:
                task.status = status
                if result is not None:
                    existing = task.result or {}
                    task.result = {**existing, **result}
                if error is not None:
                    task.error = error
                await session.commit()

    @staticmethod
    async def get_task(task_id: str) -> Optional[AITask]:
        """Отримує поточний стан задачі з бази даних."""
        async with AsyncSessionLocal() as session:
            res = await session.execute(select(AITask).where(AITask.id == task_id))
            return res.scalar_one_or_none()

    @staticmethod
    async def claim_next_pending_task(session: AsyncSession) -> Optional[AITask]:
        """
        Транзакційне взяття найдавнішої чергової задачі за допомогою FOR UPDATE SKIP LOCKED.
        Гарантує відсутність race conditions між паралельними воркерами.
        """
        stmt = (
            select(AITask)
            .where(AITask.status == "pending")
            .order_by(AITask.created_at.asc())
            .limit(1)
            .with_for_update(skip_locked=True)
        )
        res = await session.execute(stmt)
        task = res.scalar_one_or_none()
        if task:
            task.status = "processing"
            await session.commit()
        return task
