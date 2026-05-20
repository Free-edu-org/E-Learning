package pl.freeedu.backend.task.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.nio.charset.StandardCharsets;
import java.time.Duration;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.buffer.DefaultDataBufferFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFunction;
import org.springframework.web.reactive.function.client.WebClient;

import pl.freeedu.backend.task.exception.TaskErrorCode;
import pl.freeedu.backend.task.exception.TaskException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

class SttClientTest {

	@Test
	void shouldMapValidEvaluationResponse() {
		SttClient sttClient = new SttClient(webClientResponding(HttpStatus.OK, """
				{
				  "rawTranscription": "coś My name is Dominic",
				  "matchedTranscription": "my name is dominic",
				  "normalizedExpected": "my name is dominik",
				  "normalizedActual": "my name is dominic",
				  "score": 1.0,
				  "correct": true,
				  "words": [
				    { "expected": "my", "actual": "my", "correct": true },
				    { "expected": "name", "actual": "name", "correct": true }
				  ],
				  "language": "en",
				  "duration": 1.8
				}
				"""), Duration.ofSeconds(1));

		StepVerifier.create(sttClient.evaluate(mockAudioPart(), "My name is Dominik", 0.85, null)).assertNext(resp -> {
			assertEquals("coś My name is Dominic", resp.getRawTranscription());
			assertEquals("my name is dominic", resp.getMatchedTranscription());
			assertEquals(1.0, resp.getScore());
			assertTrue(resp.isCorrect());
			assertEquals("en", resp.getLanguage());
			assertEquals(1.8, resp.getDuration());
			assertEquals(2, resp.getWords().size());
		}).verifyComplete();
	}

	@Test
	void shouldRejectMissingWordsFromEvaluationResponse() {
		SttClient sttClient = new SttClient(webClientResponding(HttpStatus.OK, """
				{
				  "rawTranscription": "My name is Dominic",
				  "matchedTranscription": "my name is dominic",
				  "normalizedExpected": "my name is dominik",
				  "normalizedActual": "my name is dominic",
				  "score": 1.0,
				  "correct": true,
				  "language": "en",
				  "duration": 1.8
				}
				"""), Duration.ofSeconds(1));

		StepVerifier.create(sttClient.evaluate(mockAudioPart(), "My name is Dominik", 0.85, null))
				.expectErrorSatisfies(error -> {
					assertTrue(error instanceof TaskException);
					assertEquals(TaskErrorCode.STT_SERVICE_UNAVAILABLE, ((TaskException) error).getErrorCode());
				}).verify();
	}

	@Test
	void shouldRejectBlankRawTranscription() {
		SttClient sttClient = new SttClient(webClientResponding(HttpStatus.OK, """
				{
				  "rawTranscription": "   ",
				  "matchedTranscription": "",
				  "normalizedExpected": "my name is dominik",
				  "normalizedActual": "",
				  "score": 0.0,
				  "correct": false,
				  "words": [
				    { "expected": "my", "actual": "", "correct": false }
				  ],
				  "language": "en",
				  "duration": 1.8
				}
				"""), Duration.ofSeconds(1));

		StepVerifier.create(sttClient.evaluate(mockAudioPart(), "My name is Dominik", 0.85, null))
				.expectErrorSatisfies(error -> {
					assertTrue(error instanceof TaskException);
					assertEquals(TaskErrorCode.STT_RECOGNITION_FAILED, ((TaskException) error).getErrorCode());
				}).verify();
	}

	@Test
	void shouldMapServerErrorToServiceUnavailable() {
		SttClient sttClient = new SttClient(
				webClientResponding(HttpStatus.INTERNAL_SERVER_ERROR, "{\"detail\":\"boom\"}"), Duration.ofSeconds(1));

		StepVerifier.create(sttClient.evaluate(mockAudioPart(), "My name is Dominik", 0.85, null))
				.expectErrorSatisfies(error -> {
					assertTrue(error instanceof TaskException);
					assertEquals(TaskErrorCode.STT_SERVICE_UNAVAILABLE, ((TaskException) error).getErrorCode());
				}).verify();
	}

	@Test
	void shouldMapTimeoutToServiceUnavailable() {
		WebClient webClient = WebClient.builder().exchangeFunction(request -> Mono.never()).build();
		SttClient sttClient = new SttClient(webClient, Duration.ofMillis(20));

		StepVerifier.create(sttClient.evaluate(mockAudioPart(), "My name is Dominik", 0.85, null))
				.expectErrorSatisfies(error -> {
					assertTrue(error instanceof TaskException);
					assertEquals(TaskErrorCode.STT_SERVICE_UNAVAILABLE, ((TaskException) error).getErrorCode());
				}).verify();
	}

	@Test
	void shouldMapConnectionFailureToServiceUnavailable() {
		WebClient webClient = WebClient.builder()
				.exchangeFunction(request -> Mono.error(new RuntimeException("connection refused"))).build();
		SttClient sttClient = new SttClient(webClient, Duration.ofSeconds(1));

		StepVerifier.create(sttClient.evaluate(mockAudioPart(), "My name is Dominik", 0.85, null))
				.expectErrorSatisfies(error -> {
					assertTrue(error instanceof TaskException);
					assertEquals(TaskErrorCode.STT_SERVICE_UNAVAILABLE, ((TaskException) error).getErrorCode());
				}).verify();
	}

	private WebClient webClientResponding(HttpStatus status, String body) {
		ExchangeFunction exchangeFunction = request -> Mono.just(ClientResponse.create(status)
				.header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE).body(body).build());
		return WebClient.builder().exchangeFunction(exchangeFunction).build();
	}

	private FilePart mockAudioPart() {
		FilePart filePart = mock(FilePart.class);
		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.valueOf("audio/webm"));
		when(filePart.filename()).thenReturn("answer.webm");
		when(filePart.headers()).thenReturn(headers);
		when(filePart.content()).thenReturn(
				Flux.just(DefaultDataBufferFactory.sharedInstance.wrap("audio".getBytes(StandardCharsets.UTF_8))));
		return filePart;
	}
}
