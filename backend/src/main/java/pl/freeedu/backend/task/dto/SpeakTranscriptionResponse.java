package pl.freeedu.backend.task.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpeakTranscriptionResponse {

	private String text;
	private String expectedText;
	private boolean correct;
	private double score;
	private java.util.List<SpeakWordResultDto> words;
}
