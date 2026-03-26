package pl.freeedu.backend.lesson.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import pl.freeedu.backend.lesson.dto.LessonResponse;
import pl.freeedu.backend.lesson.model.Lesson;

@Mapper(componentModel = "spring")
public interface LessonMapper {

	@Mapping(target = "groups", ignore = true)
	@Mapping(source = "teacher.id", target = "teacherId")
	@Mapping(source = "teacher.username", target = "teacherName")
	LessonResponse toResponse(Lesson lesson);
}