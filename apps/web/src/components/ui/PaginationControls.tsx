type PaginationControlsProps = { isLoading?: boolean; onNext: () => void; onPrevious: () => void; page: number; totalPages: number };

export const PaginationControls = ({ isLoading = false, onNext, onPrevious, page, totalPages }: PaginationControlsProps) => <div className="pagination"><button className="button button-secondary button-small" disabled={page <= 1 || isLoading} onClick={onPrevious}>Anterior</button><span>Página {page} de {totalPages}</span><button className="button button-secondary button-small" disabled={page >= totalPages || isLoading} onClick={onNext}>Próxima</button></div>;
