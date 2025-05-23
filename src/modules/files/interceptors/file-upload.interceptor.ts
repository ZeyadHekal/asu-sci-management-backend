import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { FILE_UPLOAD_OPTIONS, FileUploadOptions } from '../decorators/file-upload.decorator';

@Injectable()
export class FileUploadInterceptor implements NestInterceptor {
	constructor(private reflector: Reflector) {}

	intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
		const fileOptions = this.reflector.get<FileUploadOptions>(FILE_UPLOAD_OPTIONS, context.getHandler()) || {};

		const request = context.switchToHttp().getRequest();
		request.fileOptions = fileOptions;

		return next.handle();
	}
}
