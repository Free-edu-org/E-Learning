package pl.freeedu.backend.task.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import pl.freeedu.backend.task.exception.TaskErrorCode;
import pl.freeedu.backend.task.exception.TaskException;
import pl.freeedu.backend.task.repository.ChooseTaskRepository;
import pl.freeedu.backend.task.repository.ScatterTaskRepository;
import pl.freeedu.backend.task.repository.SpeakTaskRepository;
import pl.freeedu.backend.task.repository.WriteTaskRepository;

@Service
@RequiredArgsConstructor
public class TaskPublicIdLookupService {

	private final ChooseTaskRepository chooseTaskRepository;
	private final WriteTaskRepository writeTaskRepository;
	private final ScatterTaskRepository scatterTaskRepository;
	private final SpeakTaskRepository speakTaskRepository;

	public Integer getInternalId(String publicId, String taskType) {
		return switch (taskType) {
			case "choose" -> chooseTaskRepository.findByPublicId(publicId).map(t -> t.getId())
					.orElseThrow(() -> new TaskException(TaskErrorCode.TASK_NOT_FOUND));
			case "write" -> writeTaskRepository.findByPublicId(publicId).map(t -> t.getId())
					.orElseThrow(() -> new TaskException(TaskErrorCode.TASK_NOT_FOUND));
			case "scatter" -> scatterTaskRepository.findByPublicId(publicId).map(t -> t.getId())
					.orElseThrow(() -> new TaskException(TaskErrorCode.TASK_NOT_FOUND));
			case "speak" -> speakTaskRepository.findByPublicId(publicId).map(t -> t.getId())
					.orElseThrow(() -> new TaskException(TaskErrorCode.TASK_NOT_FOUND));
			default -> throw new TaskException(TaskErrorCode.INVALID_TASK_TYPE);
		};
	}

	public String getPublicId(Integer internalId, String dbTaskType) {
		return switch (dbTaskType) {
			case "choose_tasks" -> chooseTaskRepository.findById(internalId).map(t -> t.getPublicId())
					.orElseThrow(() -> new TaskException(TaskErrorCode.TASK_NOT_FOUND));
			case "write_tasks" -> writeTaskRepository.findById(internalId).map(t -> t.getPublicId())
					.orElseThrow(() -> new TaskException(TaskErrorCode.TASK_NOT_FOUND));
			case "scatter_tasks" -> scatterTaskRepository.findById(internalId).map(t -> t.getPublicId())
					.orElseThrow(() -> new TaskException(TaskErrorCode.TASK_NOT_FOUND));
			case "speak_tasks" -> speakTaskRepository.findById(internalId).map(t -> t.getPublicId())
					.orElseThrow(() -> new TaskException(TaskErrorCode.TASK_NOT_FOUND));
			default -> throw new TaskException(TaskErrorCode.INVALID_TASK_TYPE);
		};
	}
}
