package pl.freeedu.backend.task.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SttTranscriptionResponse {

	private String text;
	private String language;
	private Double duration;
}
