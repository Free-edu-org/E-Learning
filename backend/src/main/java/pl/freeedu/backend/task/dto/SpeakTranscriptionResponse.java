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
public class SpeakTranscriptionResponse {

	private String attemptId;
	private String text;
	private String rawText;
	private String expectedText;
	private boolean correct;
	private double score;
	private List<SpeakWordResultDto> words;
}
