package pl.freeedu.backend.task.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskSectionDto {

	private String section;
	private List<ChooseTaskResponse> chooseTasks;
	private List<WriteTaskResponse> writeTasks;
	private List<ScatterTaskResponse> scatterTasks;
	private List<SpeakTaskResponse> speakTasks;
}
