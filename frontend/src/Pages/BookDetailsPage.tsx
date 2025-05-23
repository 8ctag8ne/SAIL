import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getBookById } from "../Api/BookApi";
import BookDetails from "../Components/BookDetails/BookDetails";
import CommentSection from "../Components/CommentSection/CommentSection";
import BASE_URL from "../config"; // Імпорт BASE_URL
import PageContainer from "../Components/PageContainer/PageContainer";
import { BookDetailsData, Comment, SimpleTag } from "../types";

const BookDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [book, setBook] = useState<BookDetailsData | null>(null);

    useEffect(() => {
        if (id) {
            getBookById(Number(id)).then(setBook);
        }
    }, [id]);

    if (!book) {
        return <p>Loading...</p>;
    }

    return (
        <PageContainer>
            <BookDetails
                title={book.title}
                imageUrl={book.imageUrl ? `${book.imageUrl}` : undefined}
                info={book.info}
                tags={book.tags}
                fileUrl={book.fileUrl ? `${book.fileUrl}` : undefined}
                likesCount={book.likesCount}
                isLiked={book.isLiked}
                authors={book.authors}
            />
            <CommentSection comments={book.comments} bookId={book.id} />
        </PageContainer>
    );
};

export default BookDetailsPage;