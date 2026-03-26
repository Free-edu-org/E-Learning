package pl.freeedu.backend.task.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import pl.freeedu.backend.task.dto.*;
import pl.freeedu.backend.task.model.*;

@Mapper(componentModel = "spring")
public interface TaskMapper {

	// ---- Student responses (no correct answers) ----

	@Mapping(target = "taskType", constant = "speak_tasks")
	@Mapping(target = "possibleAnswers", ignore = true)
	@Mapping(target = "words", ignore = true)
	@Mapping(target = "correctAnswerIndex", ignore = true)
	@Mapping(target = "correctAnswerText", ignore = true)
	TaskResponse toStudentResponse(SpeakTask entity);

	@Mapping(target = "taskType", constant = "choose_tasks")
	@Mapping(target = "words", ignore = true)
	@Mapping(target = "correctAnswerIndex", ignore = true)
	@Mapping(target = "correctAnswerText", ignore = true)
	TaskResponse toStudentResponse(ChooseTask entity);

	@Mapping(target = "taskType", constant = "write_tasks")
	@Mapping(target = "possibleAnswers", ignore = true)
	@Mapping(target = "words", ignore = true)
	@Mapping(target = "correctAnswerIndex", ignore = true)
	@Mapping(target = "correctAnswerText", ignore = true)
	TaskResponse toStudentResponse(WriteTask entity);

	@Mapping(target = "taskType", constant = "scatter_tasks")
	@Mapping(target = "possibleAnswers", ignore = true)
	@Mapping(target = "correctAnswerIndex", ignore = true)
	@Mapping(target = "correctAnswerText", ignore = true)
	TaskResponse toStudentResponse(ScatterTask entity);

	// ---- Admin responses (with correct answers) ----

	@Mapping(target = "taskType", constant = "speak_tasks")
	@Mapping(target = "possibleAnswers", ignore = true)
	@Mapping(target = "words", ignore = true)
	@Mapping(target = "correctAnswerIndex", ignore = true)
	@Mapping(target = "correctAnswerText", ignore = true)
	TaskResponse toAdminResponse(SpeakTask entity);

	@Mapping(target = "taskType", constant = "choose_tasks")
	@Mapping(target = "words", ignore = true)
	@Mapping(target = "correctAnswerIndex", source = "correctAnswer")
	@Mapping(target = "correctAnswerText", ignore = true)
	TaskResponse toAdminResponse(ChooseTask entity);

	@Mapping(target = "taskType", constant = "write_tasks")
	@Mapping(target = "possibleAnswers", ignore = true)
	@Mapping(target = "words", ignore = true)
	@Mapping(target = "correctAnswerIndex", ignore = true)
	@Mapping(target = "correctAnswerText", source = "correctAnswer")
	TaskResponse toAdminResponse(WriteTask entity);

	@Mapping(target = "taskType", constant = "scatter_tasks")
	@Mapping(target = "possibleAnswers", ignore = true)
	@Mapping(target = "correctAnswerIndex", ignore = true)
	@Mapping(target = "correctAnswerText", source = "correctAnswer")
	TaskResponse toAdminResponse(ScatterTask entity);

	// ---- Request -> Entity (for teacher CRUD) ----

	@Mapping(target = "id", ignore = true)
	@Mapping(target = "lessonId", ignore = true)
	@Mapping(target = "createdAt", ignore = true)
	SpeakTask toEntity(CreateSpeakTaskRequest request);

	@Mapping(target = "id", ignore = true)
	@Mapping(target = "lessonId", ignore = true)
	@Mapping(target = "createdAt", ignore = true)
	ChooseTask toEntity(CreateChooseTaskRequest request);

	@Mapping(target = "id", ignore = true)
	@Mapping(target = "lessonId", ignore = true)
	@Mapping(target = "createdAt", ignore = true)
	WriteTask toEntity(CreateWriteTaskRequest request);

	@Mapping(target = "id", ignore = true)
	@Mapping(target = "lessonId", ignore = true)
	@Mapping(target = "createdAt", ignore = true)
	ScatterTask toEntity(CreateScatterTaskRequest request);
}
