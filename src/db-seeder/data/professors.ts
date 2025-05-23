import { PrivilegeCode } from './privileges';

export interface ProfessorConfig {
	name: string;
	username?: string; // Will be generated if not provided
	password?: string; // Will use default if not provided
	courses: { courseCode: string; courseNumber: number }[];
}

// Professor assignments and course mappings
export const PROFESSORS_CONFIG: ProfessorConfig[] = [
	// Mohammed Hashim
	{
		name: 'Mohammed Hashim',
		username: 'mohammed.hashim',
		courses: [
			{ courseCode: 'COMP', courseNumber: 104 }, // برمجة حاسب (1)
			{ courseCode: 'COMP', courseNumber: 205 }, // برمجة حاسب (2)
			{ courseCode: 'COMP', courseNumber: 304 }, // تصميم واجهات
			{ courseCode: 'COMP', courseNumber: 404 }, // هندسة البرمجيات
			{ courseCode: 'COMP', courseNumber: 406 }, // مشروع برمجي (ب)
		],
	},

	// Mohamed Fakhry
	{
		name: 'Mohamed Fakhry',
		username: 'mohamed.fakhry',
		courses: [
			{ courseCode: 'COMP', courseNumber: 201 }, // تصميم وتحليل الخوارزميات
			{ courseCode: 'COMP', courseNumber: 207 }, // تطوير مواقع ويب
			{ courseCode: 'COMP', courseNumber: 206 }, // برمجة الويب
			{ courseCode: 'COMP', courseNumber: 310 }, // برمجة ويب متقدمة
			{ courseCode: 'COMP', courseNumber: 302 }, // برمجة تطبيقات للأجهزة الذكية
		],
	},

	// Dieaa Nasr
	{
		name: 'Dieaa Nasr',
		username: 'dieaa.nasr',
		courses: [
			{ courseCode: 'COMP', courseNumber: 202 }, // تراكيب البيانات
			{ courseCode: 'COMP', courseNumber: 307 }, // نظم التشغيل
			{ courseCode: 'COMP', courseNumber: 314 }, // نظم قواعد بيانات متقدمة
			{ courseCode: 'COMP', courseNumber: 409 }, // أمن البيانات
		],
	},

	// Nashwa Abdelghaffar
	{
		name: 'Nashwa Abdelghaffar',
		username: 'nashwa.abdelghaffar',
		courses: [
			{ courseCode: 'COMP', courseNumber: 401 }, // ذكاء اصطناعي
			{ courseCode: 'COMP', courseNumber: 407 }, // معالجة الصور
			{ courseCode: 'COMP', courseNumber: 408 }, // موضوعات متقدمة في الذكاء الاصطناعي
			{ courseCode: 'COMP', courseNumber: 306 }, // رسومات الحاسب
			{ courseCode: 'COMP', courseNumber: 308 }, // تعلم الآلة
		],
	},
];
