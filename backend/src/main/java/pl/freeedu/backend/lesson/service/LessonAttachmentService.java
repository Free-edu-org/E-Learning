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
import org.springframework.transaction.annotation.Transactional;
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
import lombok.extern.slf4j.Slf4j;

@Slf4j
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
			log.info("Attachment upload started for lesson ID: {}", lessonId);
			lessonRepository.findById(lessonId).orElseThrow(() -> {
				log.warn("Attachment upload failed: Lesson with ID: {} not found", lessonId);
				return new LessonException(LessonErrorCode.LESSON_NOT_FOUND);
			});

			String contentType = filePart.headers().getContentType() != null
					? filePart.headers().getContentType().toString()
					: "";
			String baseType = contentType.contains(";")
					? contentType.substring(0, contentType.indexOf(';')).trim()
					: contentType.trim();
			if (!ALLOWED_TYPES.containsKey(baseType)) {
				log.warn("Attachment upload failed for lesson ID: {}: invalid content type: {}", lessonId, baseType);
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
					log.debug("Preparing attachment directory for lesson ID: {}", lessonId);
					Files.createDirectories(dir);
					return filePath;
				} catch (IOException e) {
					log.error("Failed to prepare attachment directory for lesson ID: {}", lessonId, e);
					throw new RuntimeException("Failed to prepare attachment directory", e);
				}
			}).subscribeOn(Schedulers.boundedElastic()).flatMap(path -> filePart.transferTo(path).thenReturn(path))
					.flatMap(path -> Mono.fromCallable(() -> {
						try {
							long fileSize = Files.size(path);
							if (fileSize > MAX_FILE_SIZE_BYTES) {
								log.warn("Attachment upload failed for lesson ID: {}: file too large ({} bytes)",
										lessonId, fileSize);
								Files.deleteIfExists(path);
								throw new LessonException(LessonErrorCode.ATTACHMENT_FILE_TOO_LARGE);
							}
							// Pessimistic lock prevents concurrent uploads from both passing the
							// count check and exceeding MAX_ATTACHMENTS_PER_LESSON.
							LessonAttachment saved = transactionTemplate.execute(status -> {
								lessonRepository.findByIdForUpdate(lessonId).orElseThrow(() -> {
									log.warn("Attachment processing failed: Lesson with ID: {} not found", lessonId);
									return new LessonException(LessonErrorCode.LESSON_NOT_FOUND);
								});
								long count = lessonAttachmentRepository.countByLessonId(lessonId);
								if (count >= MAX_ATTACHMENTS_PER_LESSON) {
									log.warn("Attachment upload failed for lesson ID: {}: limit reached ({}/{})",
											lessonId, count, MAX_ATTACHMENTS_PER_LESSON);
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
							log.info("Attachment uploaded successfully for lesson ID: {}. Attachment ID: {}", lessonId,
									saved.getId());
							return toResponse(saved);
						} catch (IOException e) {
							log.error("Failed to process attachment file for lesson ID: {}", lessonId, e);
							throw new RuntimeException("Failed to process attachment file", e);
						}
					}).subscribeOn(Schedulers.boundedElastic()));
		});
	}

	public Mono<ResponseEntity<Resource>> downloadAttachment(Integer lessonId, String attachmentPublicId) {
		return Mono.fromCallable(() -> {
			log.info("Downloading attachment publicId: {} for lesson ID: {}", attachmentPublicId, lessonId);
			lessonRepository.findById(lessonId).orElseThrow(() -> {
				log.warn("Download failed: Lesson with ID: {} not found", lessonId);
				return new LessonException(LessonErrorCode.LESSON_NOT_FOUND);
			});

			LessonAttachment attachment = lessonAttachmentRepository.findByPublicId(attachmentPublicId)
					.orElseThrow(() -> {
						log.warn("Download failed: Attachment with publicId: {} not found", attachmentPublicId);
						return new LessonException(LessonErrorCode.ATTACHMENT_NOT_FOUND);
					});

			if (!lessonId.equals(attachment.getLessonId())) {
				log.warn("Download failed: Attachment publicId: {} does not belong to lesson ID: {}",
						attachmentPublicId, lessonId);
				throw new LessonException(LessonErrorCode.ATTACHMENT_NOT_FOUND);
			}

			Path filePath = Paths.get(ATTACHMENT_DIR).resolve(attachment.getStoredFileName());
			Resource resource = new FileSystemResource(filePath);
			if (!resource.exists()) {
				log.error("Download failed: Attachment file not found on disk: {}", filePath);
				throw new LessonException(LessonErrorCode.ATTACHMENT_NOT_FOUND);
			}

			HttpHeaders headers = new HttpHeaders();
			headers.setContentType(MediaType.parseMediaType(attachment.getContentType()));
			headers.setContentDisposition(
					ContentDisposition.attachment().filename(attachment.getOriginalFileName()).build());

			log.debug("Attachment publicId: {} download successful", attachmentPublicId);
			return ResponseEntity.<Resource>ok().headers(headers).body(resource);
		}).subscribeOn(Schedulers.boundedElastic());
	}

	public Mono<Void> deleteAttachment(Integer lessonId, String attachmentPublicId) {
		return Mono.fromCallable(() -> {
			log.info("Deleting attachment publicId: {} for lesson ID: {}", attachmentPublicId, lessonId);
			lessonRepository.findById(lessonId).orElseThrow(() -> {
				log.warn("Delete failed: Lesson with ID: {} not found", lessonId);
				return new LessonException(LessonErrorCode.LESSON_NOT_FOUND);
			});

			LessonAttachment attachment = lessonAttachmentRepository.findByPublicId(attachmentPublicId)
					.orElseThrow(() -> {
						log.warn("Delete failed: Attachment with publicId: {} not found", attachmentPublicId);
						return new LessonException(LessonErrorCode.ATTACHMENT_NOT_FOUND);
					});

			if (!lessonId.equals(attachment.getLessonId())) {
				log.warn("Delete failed: Attachment publicId: {} does not belong to lesson ID: {}", attachmentPublicId,
						lessonId);
				throw new LessonException(LessonErrorCode.ATTACHMENT_NOT_FOUND);
			}

			try {
				Path path = Paths.get(ATTACHMENT_DIR).resolve(attachment.getStoredFileName());
				log.debug("Deleting attachment file from disk: {}", path);
				Files.deleteIfExists(path);
			} catch (IOException e) {
				log.warn("Failed to delete attachment file from disk for attachment publicId: {}. Error: {}",
						attachmentPublicId, e.getMessage());
			}
			lessonAttachmentRepository.delete(attachment);
			log.info("Attachment publicId: {} deleted successfully", attachmentPublicId);
			return (Void) null;
		}).subscribeOn(Schedulers.boundedElastic()).then();
	}

	@Transactional
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
		return LessonAttachmentResponse.builder().publicId(attachment.getPublicId())
				.originalFileName(attachment.getOriginalFileName()).contentType(attachment.getContentType())
				.fileSize(attachment.getFileSize()).createdAt(attachment.getCreatedAt()).build();
	}
}
