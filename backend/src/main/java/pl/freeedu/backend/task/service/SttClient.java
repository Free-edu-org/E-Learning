package pl.freeedu.backend.task.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.buffer.DataBufferUtils;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import pl.freeedu.backend.task.dto.SttTranscriptionResponse;
import pl.freeedu.backend.task.exception.TaskErrorCode;
import pl.freeedu.backend.task.exception.TaskException;
import reactor.core.publisher.Mono;

@Slf4j
@Component
public class SttClient {

	private final WebClient webClient;

	public SttClient(@Value("${application.stt.base-url}") String sttBaseUrl) {
		log.info("Initializing SttClient with base URL: {}", sttBaseUrl);
		this.webClient = WebClient.builder().baseUrl(sttBaseUrl).build();
	}

	public Mono<SttTranscriptionResponse> transcribe(FilePart audio) {
		log.info("Starting transcription request");
		return DataBufferUtils.join(audio.content()).flatMap(dataBuffer -> {
			byte[] bytes = new byte[dataBuffer.readableByteCount()];
			dataBuffer.read(bytes);
			DataBufferUtils.release(dataBuffer);

			log.debug("Read {} bytes from audio file", bytes.length);

			MultipartBodyBuilder bodyBuilder = new MultipartBodyBuilder();
			bodyBuilder.part("file", new NamedByteArrayResource(bytes, audio.filename()))
					.contentType(resolveContentType(audio));

			return webClient.post().uri("/stt/transcribe").contentType(MediaType.MULTIPART_FORM_DATA)
					.body(BodyInserters.fromMultipartData(bodyBuilder.build())).retrieve()
					.bodyToMono(SttTranscriptionResponse.class).doOnSuccess(resp -> {
						if (resp != null) {
							log.info("Transcription successful");
							log.debug("Transcription result length: {}",
									resp.getText() != null ? resp.getText().length() : 0);
						} else {
							log.warn("Transcription returned empty response");
						}
					});
		}).doOnError(ex -> log.error("Transcription failed", ex))
				.onErrorMap(WebClientResponseException.class,
						ex -> new TaskException(TaskErrorCode.STT_SERVICE_UNAVAILABLE, ex))
				.onErrorMap(ex -> !(ex instanceof TaskException),
						ex -> new TaskException(TaskErrorCode.STT_SERVICE_UNAVAILABLE, ex));
	}

	private MediaType resolveContentType(FilePart audio) {
		MediaType contentType = audio.headers().getContentType();
		return contentType != null ? contentType : MediaType.APPLICATION_OCTET_STREAM;
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
