import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentFilesController } from './student-files.controller';
import { StudentFilesService } from './student-files.service';
import { StudentsFiles } from '../../database/students/student_files.entity';
import { File } from '../files/entities/file.entity';
import { FileModule } from '../files/module';

@Module({
    imports: [
        TypeOrmModule.forFeature([StudentsFiles, File]),
        FileModule
    ],
    controllers: [StudentFilesController],
    providers: [StudentFilesService],
    exports: [StudentFilesService]
})
export class StudentFilesModule { } 