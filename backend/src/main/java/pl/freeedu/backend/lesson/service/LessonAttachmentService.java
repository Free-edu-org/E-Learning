package pl.freeedu.backend.lesson.service;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.stereotype.Service;
import pl.freeedu.backend.lesson.dto.LessonAttachmentResponse;
import pl.freeedu.backend.lesson.exception.LessonErrorCode;
import pl.freeedu.backend.lesson.exception.LessonException;
import pl.freeedu.backend.lesson.model.LessonAttachment;
import pl.freeedu.backend.lesson.repository.LessonAttachmentRepository;
import pl.freeedu.backend.lesson.repository.LessonRepository;
import org.springframework.transaction.support.TransactionTemplate;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class LessonAttachmentService {

	private static final int MAX_ATTACHMENTS_PER_LESSON = 5;

	private static final Map<String, String> ALLOWED_TYPES = Map.of("application/pdf", "pdf", "text/plain", "txt",
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document", "docx", "application/msword",
			"doc", "application/vnd.oasis.opendocument.text", "odt");

	private static final long MAX_FILE_SIZE_BYTES = 10L * 1024 * 1024; // 10 MB
	private static final String ATTACHMENT_DIR = "uploads/attachments";

	private final LessonAttachmentRepository lessonAttachmentRepository;
	private final LessonRepository lessonRepository;
	private final TransactionTemplate transactionTemplate;

	public LessonAttachmentService(LessonAttachmentRepository lessonAttachmentRepository,
			LessonRepository lessonRepository, TransactionTemplate transactionTemplate) {
		this.lessonAttachmentRepository = lessonAttachmentRepository;
		this.lessonRepository = lessonRepository;
		this.transactionTemplate = transactionTemplate;
	}

	public Mono<LessonAttachmentResponse> uploadAttachment(Integer lessonId, FilePart filePart) {
		return Mono.fromCallable(() -> {
			// Fast-fail: check lesson exists and content type before doing file I/O.
			// This is an optimistic pre-check only; the definitive limit check is atomic
			// below.
			lessonRepository.findById(lessonId)
					.orElseThrow(() -> new LessonException(LessonErrorCode.LESSON_NOT_FOUND));

			String contentType = filePart.headers().getContentType() != null
					? filePart.headers().getContentType().toString()
					: "";
			String baseType = contentType.contains(";")
					? contentType.substring(0, contentType.indexOf(';')).trim()
					: contentType.trim();
			if (!ALLOWED_TYPES.containsKey(baseType)) {
				throw new LessonException(LessonErrorCode.ATTACHMENT_INVALID_FILE_TYPE);
			}
			return baseType;
		}).subscribeOn(Schedulers.boundedElastic()).flatMap(baseType -> {
			String originalName = filePart.filename();
			String extension = ALLOWED_TYPES.get(baseType);
			String storedName = "lesson_" + lessonId + "_" + UUID.randomUUID() + "." + extension;
			Path dir = Paths.get(ATTACHMENT_DIR);
			Path filePath = dir.resolve(storedName);

			return Mono.fromCallable(() -> {
				try {
					Files.createDirectories(dir);
					return filePath;
				} catch (IOException e) {
					throw new RuntimeException("Failed to prepare attachment directory", e);
				}
			}).subscribeOn(Schedulers.boundedElastic()).flatMap(path -> filePart.transferTo(path).thenReturn(path))
					.flatMap(path -> Mono.fromCallable(() -> {
						try {
							long fileSize = Files.size(path);
							if (fileSize > MAX_FILE_SIZE_BYTES) {
								Files.deleteIfExists(path);
								throw new LessonException(LessonErrorCode.ATTACHMENT_FILE_TOO_LARGE);
							}
							// Atomic count check + save under a pessimistic row-level lock so that
							// concurrent uploads for the same lesson cannot both pass the limit check.
							LessonAttachment saved = transactionTemplate.execute(status -> {
								lessonRepository.findByIdForUpdate(lessonId)
										.orElseThrow(() -> new LessonException(LessonErrorCode.LESSON_NOT_FOUND));
								long count = lessonAttachmentRepository.countByLessonId(lessonId);
								if (count >= MAX_ATTACHMENTS_PER_LESSON) {
									try {
										Files.deleteIfExists(path);
									} catch (IOException ignored) {
									}
									throw new LessonException(LessonErrorCode.ATTACHMENT_LIMIT_REACHED);
								}
								LessonAttachment attachment = LessonAttachment.builder().lessonId(lessonId)
										.originalFileName(originalName).storedFileName(storedName).contentType(baseType)
										.fileSize(fileSize).build();
								return lessonAttachmentRepository.save(attachment);
							});
							return toResponse(saved);
						} catch (IOException e) {
							throw new RuntimeException("Failed to process attachment file", e);
						}
					}).subscribeOn(Schedulers.boundedElastic()));
		});
	}

	public Mono<ResponseEntity<Resource>> downloadAttachment(Integer lessonId, Integer attachmentId) {
		return Mono.fromCallable(() -> {
			lessonRepository.findById(lessonId)
					.orElseThrow(() -> new LessonException(LessonErrorCode.LESSON_NOT_FOUND));

			LessonAttachment attachment = lessonAttachmentRepository.findById(attachmentId)
					.orElseThrow(() -> new LessonException(LessonErrorCode.ATTACHMENT_NOT_FOUND));

			if (!lessonId.equals(attachment.getLessonId())) {
				throw new LessonException(LessonErrorCode.ATTACHMENT_NOT_FOUND);
			}

			Path filePath = Paths.get(ATTACHMENT_DIR).resolve(attachment.getStoredFileName());
			Resource resource = new FileSystemResource(filePath);
			if (!resource.exists()) {
				throw new LessonException(LessonErrorCode.ATTACHMENT_NOT_FOUND);
			}

			HttpHeaders headers = new HttpHeaders();
			headers.setContentType(MediaType.parseMediaType(attachment.getContentType()));
			headers.setContentDisposition(
					ContentDisposition.attachment().filename(attachment.getOriginalFileName()).build());

			return ResponseEntity.<Resource>ok().headers(headers).body(resource);
		}).subscribeOn(Schedulers.boundedElastic());
	}

	public Mono<Void> deleteAttachment(Integer lessonId, Integer attachmentId) {
		return Mono.fromCallable(() -> {
			lessonRepository.findById(lessonId)
					.orElseThrow(() -> new LessonException(LessonErrorCode.LESSON_NOT_FOUND));

			LessonAttachment attachment = lessonAttachmentRepository.findById(attachmentId)
					.orElseThrow(() -> new LessonException(LessonErrorCode.ATTACHMENT_NOT_FOUND));

			if (!lessonId.equals(attachment.getLessonId())) {
				throw new LessonException(LessonErrorCode.ATTACHMENT_NOT_FOUND);
			}

			try {
				Files.deleteIfExists(Paths.get(ATTACHMENT_DIR).resolve(attachment.getStoredFileName()));
			} catch (IOException e) {
				// ignore, best-effort cleanup
			}
			lessonAttachmentRepository.delete(attachment);
			return (Void) null;
		}).subscribeOn(Schedulers.boundedElastic()).then();
	}

	public void deleteAttachmentsByLessonId(Integer lessonId) {
		List<LessonAttachment> all = lessonAttachmentRepository.findAllByLessonId(lessonId);
		for (LessonAttachment attachment : all) {
			try {
				Files.deleteIfExists(Paths.get(ATTACHMENT_DIR).resolve(attachment.getStoredFileName()));
			} catch (IOException e) {
				// ignore, best-effort cleanup
			}
		}
		lessonAttachmentRepository.deleteByLessonId(lessonId);
	}

	public List<LessonAttachmentResponse> findByLessonId(Integer lessonId) {
		return lessonAttachmentRepository.findAllByLessonId(lessonId).stream().map(this::toResponse)
				.collect(Collectors.toList());
	}

	public Map<Integer, List<LessonAttachmentResponse>> findByLessonIds(Collection<Integer> lessonIds) {
		if (lessonIds.isEmpty()) {
			return Map.of();
		}
		return lessonAttachmentRepository.findByLessonIdIn(lessonIds).stream().collect(Collectors
				.groupingBy(LessonAttachment::getLessonId, Collectors.mapping(this::toResponse, Collectors.toList())));
	}

	private LessonAttachmentResponse toResponse(LessonAttachment attachment) {
		return LessonAttachmentResponse.builder().id(attachment.getId())
				.originalFileName(attachment.getOriginalFileName()).contentType(attachment.getContentType())
				.fileSize(attachment.getFileSize()).createdAt(attachment.getCreatedAt()).build();
	}
}
