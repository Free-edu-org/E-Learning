package pl.freeedu.backend.task.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.core.codec.DecodingException;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import pl.freeedu.backend.task.dto.SttEvaluationResponse;
import pl.freeedu.backend.task.dto.SttEvaluationWordDto;
import pl.freeedu.backend.task.exception.TaskErrorCode;
import pl.freeedu.backend.task.exception.TaskException;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;
import java.util.concurrent.TimeoutException;

@Slf4j
@Component
public class SttClient {

	private final WebClient webClient;
	private final Duration requestTimeout;

	@Autowired
	public SttClient(@Value("${application.stt.base-url}") String sttBaseUrl,
			@Value("${application.stt.timeout-seconds:20}") long timeoutSeconds) {
		log.info("Initializing SttClient with base URL: {}", sttBaseUrl);
		this.webClient = WebClient.builder().baseUrl(sttBaseUrl).exchangeStrategies(ExchangeStrategies.builder()
				.codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(1024 * 1024)).build()).build();
		this.requestTimeout = Duration.ofSeconds(timeoutSeconds);
	}

	SttClient(WebClient webClient, Duration requestTimeout) {
		this.webClient = webClient;
		this.requestTimeout = requestTimeout;
	}

	public Mono<SttEvaluationResponse> evaluate(FilePart audio, String expectedText, double minScore, String language) {
		log.info("Starting STT evaluation request");
		return DataBufferUtils.join(audio.content()).flatMap(dataBuffer -> {
			byte[] bytes = new byte[dataBuffer.readableByteCount()];
			dataBuffer.read(bytes);
			DataBufferUtils.release(dataBuffer);

			MultipartBodyBuilder bodyBuilder = new MultipartBodyBuilder();
			bodyBuilder.part("file", new NamedByteArrayResource(bytes, audio.filename()))
					.contentType(resolveContentType(audio));
			bodyBuilder.part("expectedText", expectedText);
			bodyBuilder.part("minScore", String.valueOf(minScore));
			if (language != null && !language.isBlank()) {
				bodyBuilder.part("language", language);
			}

			return webClient.post().uri("/stt/evaluate").contentType(MediaType.MULTIPART_FORM_DATA)
					.body(BodyInserters.fromMultipartData(bodyBuilder.build())).retrieve()
					.bodyToMono(SttEvaluationResponse.class)
					.switchIfEmpty(Mono.error(new TaskException(TaskErrorCode.STT_SERVICE_UNAVAILABLE)))
					.timeout(requestTimeout).map(this::validateEvaluationResponse);
		}).onErrorMap(this::mapSttFailure);
	}

	private MediaType resolveContentType(FilePart audio) {
		MediaType contentType = audio.headers().getContentType();
		return contentType != null ? contentType : MediaType.APPLICATION_OCTET_STREAM;
	}

	private SttEvaluationResponse validateEvaluationResponse(SttEvaluationResponse response) {
		if (response == null) {
			throw new TaskException(TaskErrorCode.STT_SERVICE_UNAVAILABLE);
		}
		if (response.getRawTranscription() == null || response.getRawTranscription().isBlank()) {
			throw new TaskException(TaskErrorCode.STT_RECOGNITION_FAILED);
		}
		if (response.getMatchedTranscription() == null || response.getNormalizedExpected() == null
				|| response.getNormalizedActual() == null || response.getWords() == null) {
			throw new TaskException(TaskErrorCode.STT_SERVICE_UNAVAILABLE);
		}
		if (response.getScore() < 0.0 || response.getScore() > 1.0) {
			throw new TaskException(TaskErrorCode.STT_SERVICE_UNAVAILABLE);
		}
		List<SttEvaluationWordDto> words = response.getWords();
		if (words.stream().anyMatch(word -> word == null || word.getExpected() == null || word.getExpected().isBlank()
				|| word.getActual() == null)) {
			throw new TaskException(TaskErrorCode.STT_SERVICE_UNAVAILABLE);
		}
		return response;
	}

	private Throwable mapSttFailure(Throwable throwable) {
		if (throwable instanceof TaskException taskException) {
			if (taskException.getErrorCode() == TaskErrorCode.STT_RECOGNITION_FAILED) {
				log.warn("STT recognition failed: {}", taskException.getMessage());
			} else {
				log.error("STT request failed", taskException);
			}
			return taskException;
		}
		if (throwable instanceof TimeoutException || throwable instanceof WebClientRequestException
				|| throwable instanceof WebClientResponseException) {
			log.error("STT service unavailable", throwable);
			return new TaskException(TaskErrorCode.STT_SERVICE_UNAVAILABLE, throwable);
		}
		if (throwable instanceof DecodingException || throwable instanceof IllegalArgumentException
				|| throwable instanceof NullPointerException) {
			log.error("STT response payload is invalid", throwable);
			return new TaskException(TaskErrorCode.STT_SERVICE_UNAVAILABLE, throwable);
		}
		log.error("Unexpected STT client failure", throwable);
		return new TaskException(TaskErrorCode.STT_SERVICE_UNAVAILABLE, throwable);
	}

	private static class NamedByteArrayResource extends ByteArrayResource {

		private final String filename;

		NamedByteArrayResource(byte[] byteArray, String filename) {
			super(byteArray);
			this.filename = filename;
		}

		@Override
		public String getFilename() {
			return filename;
		}
	}
}
