import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

/**
 * Parameter decorator for extracting signed URL parameters from request
 */
export const SignedUrl = createParamDecorator(
    (data: { expirySeconds?: number } = {}, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest<Request>();
        const expirySeconds = Number(request.query.expiry) || data.expirySeconds || undefined;

        return { expirySeconds };
    },
); 