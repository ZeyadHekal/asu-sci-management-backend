import { plainToInstance, ClassTransformOptions } from 'class-transformer';

export const defaultTransformOptions: ClassTransformOptions = {
	excludeExtraneousValues: true,
	exposeDefaultValues: true,
	exposeUnsetFields: false,
	enableImplicitConversion: true,
};

export function transformToInstance<T, V>(cls: new () => T, plain: V, options: ClassTransformOptions = defaultTransformOptions): T {
	for (const key in defaultTransformOptions) {
		if (!options.hasOwnProperty(key)) {
			(options as any)[key] = (defaultTransformOptions as any)[key];
		}
	}
	return plainToInstance(cls, plain, options);
}
