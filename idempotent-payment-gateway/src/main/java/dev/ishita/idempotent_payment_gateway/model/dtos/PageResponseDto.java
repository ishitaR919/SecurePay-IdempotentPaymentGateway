package dev.ishita.idempotent_payment_gateway.model.dtos;

import java.util.List;

public record PageResponseDto<T>(
        List<T> content,
        int pageNumber,
        int pageSize,
        long totalElements,
        int totalPages,
        boolean last
) {}
