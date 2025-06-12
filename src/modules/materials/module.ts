import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaterialController } from './controller';
import { MaterialService } from './service';
import { Material } from 'src/database/materials/material.entity';
import { Course } from 'src/database/courses/course.entity';
import { CourseAccessPermission } from 'src/database/courses/course-access.entity';
import { FileModule } from '../files/module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Material, Course, CourseAccessPermission]),
        FileModule,
    ],
    controllers: [MaterialController],
    providers: [MaterialService],
    exports: [MaterialService],
})
export class MaterialModule { } 