package pl.freeedu.backend.task.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SttEvaluationResponse {

	private String rawTranscription;
	private String matchedTranscription;
	private String expectedText;
	private String normalizedExpected;
	private String normalizedActual;
	private double score;
	private boolean correct;
	private List<SttEvaluationWordDto> words;
	private String language;
	private Double duration;
}
