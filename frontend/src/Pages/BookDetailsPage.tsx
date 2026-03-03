import { useParams } from "react-router-dom";
import { useBook } from "../hooks/useBooks";
import BookDetails from "../components/books/BookDetails/BookDetails";
import CommentSection from "../components/comments/CommentSection/CommentSection";
import PageContainer from "../components/layout/PageContainer/PageContainer";
import LoadingIndicator from "../components/ui/LoadingIndicator";

const BookDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { data: book, isLoading, isError } = useBook(Number(id));

    if (isLoading) {
        return <LoadingIndicator />;
    }

    if (isError || !book) {
        return (
            <PageContainer>
                <div>Error loading book.</div>
            </PageContainer>
        );
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