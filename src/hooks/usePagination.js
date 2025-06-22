import { useState, useCallback, useMemo } from 'react';
import { DEFAULT_PAGE_SIZE } from '../utils/constants';

export const usePagination = (initialPageSize = DEFAULT_PAGE_SIZE) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalItems, setTotalItems] = useState(0);

  // Calculate pagination info
  const paginationInfo = useMemo(() => {
    const totalPages = Math.ceil(totalItems / pageSize);
    const hasNext = currentPage < totalPages;
    const hasPrev = currentPage > 1;
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    return {
      currentPage,
      pageSize,
      totalItems,
      totalPages,
      hasNext,
      hasPrev,
      startItem,
      endItem,
    };
  }, [currentPage, pageSize, totalItems]);

  // Generate page numbers for pagination component
  const pageNumbers = useMemo(() => {
    const { totalPages } = paginationInfo;
    const delta = 2; // Number of pages to show on each side of current page
    const pages = [];

    // Always show first page
    if (totalPages > 0) {
      pages.push(1);
    }

    // Add ellipsis if needed
    if (currentPage - delta > 2) {
      pages.push('...');
    }

    // Add pages around current page
    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      pages.push(i);
    }

    // Add ellipsis if needed
    if (currentPage + delta < totalPages - 1) {
      pages.push('...');
    }

    // Always show last page (if different from first)
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  }, [currentPage, paginationInfo.totalPages]);

  // Go to specific page
  const goToPage = useCallback((page) => {
    const { totalPages } = paginationInfo;
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [paginationInfo.totalPages]);

  // Go to next page
  const nextPage = useCallback(() => {
    if (paginationInfo.hasNext) {
      setCurrentPage(prev => prev + 1);
    }
  }, [paginationInfo.hasNext]);

  // Go to previous page
  const prevPage = useCallback(() => {
    if (paginationInfo.hasPrev) {
      setCurrentPage(prev => prev - 1);
    }
  }, [paginationInfo.hasPrev]);

  // Go to first page
  const firstPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  // Go to last page
  const lastPage = useCallback(() => {
    setCurrentPage(paginationInfo.totalPages);
  }, [paginationInfo.totalPages]);

  // Change page size
  const changePageSize = useCallback((newPageSize) => {
    const { startItem } = paginationInfo;
    
    // Calculate new page to maintain position
    const newPage = Math.ceil(startItem / newPageSize);
    
    setPageSize(newPageSize);
    setCurrentPage(newPage);
  }, [paginationInfo.startItem]);

  // Reset pagination
  const reset = useCallback(() => {
    setCurrentPage(1);
    setTotalItems(0);
  }, []);

  // Update total items (usually called when data is fetched)
  const updateTotalItems = useCallback((total) => {
    setTotalItems(total);
    
    // Adjust current page if it's beyond the new total pages
    const newTotalPages = Math.ceil(total / pageSize);
    if (currentPage > newTotalPages && newTotalPages > 0) {
      setCurrentPage(newTotalPages);
    }
  }, [currentPage, pageSize]);

  // Get pagination parameters for API calls
  const getPaginationParams = useCallback(() => {
    return {
      page: currentPage,
      limit: pageSize,
    };
  }, [currentPage, pageSize]);

  return {
    // State
    ...paginationInfo,
    pageNumbers,

    // Actions
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    changePageSize,
    reset,
    updateTotalItems,

    // Helpers
    getPaginationParams,
  };
};

// Hook for client-side pagination of arrays
export const useClientPagination = (data = [], initialPageSize = DEFAULT_PAGE_SIZE) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  // Calculate paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, pageSize]);

  // Calculate pagination info
  const paginationInfo = useMemo(() => {
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const hasNext = currentPage < totalPages;
    const hasPrev = currentPage > 1;
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    return {
      currentPage,
      pageSize,
      totalItems,
      totalPages,
      hasNext,
      hasPrev,
      startItem,
      endItem,
    };
  }, [data.length, currentPage, pageSize]);

  // Go to specific page
  const goToPage = useCallback((page) => {
    const { totalPages } = paginationInfo;
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [paginationInfo.totalPages]);

  // Go to next page
  const nextPage = useCallback(() => {
    if (paginationInfo.hasNext) {
      setCurrentPage(prev => prev + 1);
    }
  }, [paginationInfo.hasNext]);

  // Go to previous page
  const prevPage = useCallback(() => {
    if (paginationInfo.hasPrev) {
      setCurrentPage(prev => prev - 1);
    }
  }, [paginationInfo.hasPrev]);

  // Change page size
  const changePageSize = useCallback((newPageSize) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  // Reset to first page
  const reset = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    // Data
    data: paginatedData,
    
    // Pagination info
    ...paginationInfo,

    // Actions
    goToPage,
    nextPage,
    prevPage,
    changePageSize,
    reset,
  };
};

export default usePagination;