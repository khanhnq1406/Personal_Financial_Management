package jobs

import (
	"context"
	"fmt"
	"time"

	v1 "wealthjourney/protobuf/v1"
)

// ImportJobAdapter wraps ImportJob to implement service.ImportJobQueue interface
type ImportJobAdapter struct {
	*ImportJob
}

// ToServiceJob converts ImportJob to the format expected by the service interface
func (j *ImportJob) ToServiceJob() *ImportJobAdapter {
	return &ImportJobAdapter{ImportJob: j}
}

// ImportQueueAdapter wraps ImportJobQueue to work with the service layer
type ImportQueueAdapter struct {
	queue ImportJobQueue
}

// NewImportQueueAdapter creates a new adapter
func NewImportQueueAdapter(queue ImportJobQueue) *ImportQueueAdapter {
	return &ImportQueueAdapter{queue: queue}
}

// Enqueue implements service.ImportJobQueue
func (a *ImportQueueAdapter) Enqueue(ctx context.Context, job interface{}) error {
	importJob, ok := job.(*ImportJob)
	if !ok {
		return fmt.Errorf("invalid job type: expected *ImportJob")
	}
	return a.queue.Enqueue(ctx, importJob)
}

// ImportJobData matches the service layer's ImportJobData struct to avoid import cycle
type ImportJobData struct {
	JobID          string
	UserID         int32
	FileID         string
	WalletID       int32
	Status         string // Store as string to avoid type conversion
	Progress       int32
	ProcessedCount int32
	TotalCount     int32
	Result         *v1.ExecuteImportResponse
	Error          string
	CreatedAt      time.Time
	StartedAt      *time.Time
	CompletedAt    *time.Time
	ExpiresAt      time.Time
}

// toImportJobData converts ImportJob to ImportJobData
func toImportJobData(job *ImportJob) *ImportJobData {
	return &ImportJobData{
		JobID:          job.JobID,
		UserID:         job.UserID,
		FileID:         job.FileID,
		WalletID:       job.WalletID,
		Status:         string(job.Status),
		Progress:       job.Progress,
		ProcessedCount: job.ProcessedCount,
		TotalCount:     job.TotalCount,
		Result:         job.Result,
		Error:          job.Error,
		CreatedAt:      job.CreatedAt,
		StartedAt:      job.StartedAt,
		CompletedAt:    job.CompletedAt,
		ExpiresAt:      job.ExpiresAt,
	}
}

// GetJob implements service.ImportJobQueue
func (a *ImportQueueAdapter) GetJob(ctx context.Context, jobID string) (interface{}, error) {
	job, err := a.queue.GetJob(ctx, jobID)
	if err != nil {
		return nil, err
	}
	if job == nil {
		return nil, nil
	}
	return toImportJobData(job), nil
}

// UpdateJob implements service.ImportJobQueue
func (a *ImportQueueAdapter) UpdateJob(ctx context.Context, job interface{}) error {
	importJob, ok := job.(*ImportJob)
	if !ok {
		return fmt.Errorf("invalid job type: expected *ImportJob")
	}
	return a.queue.UpdateJob(ctx, importJob)
}

// CancelJob implements service.ImportJobQueue
func (a *ImportQueueAdapter) CancelJob(ctx context.Context, jobID string) error {
	return a.queue.CancelJob(ctx, jobID)
}

// GetUserJobs implements service.ImportJobQueue
func (a *ImportQueueAdapter) GetUserJobs(ctx context.Context, userID int32) ([]interface{}, error) {
	jobs, err := a.queue.GetUserJobs(ctx, userID)
	if err != nil {
		return nil, err
	}

	result := make([]interface{}, len(jobs))
	for i, j := range jobs {
		result[i] = toImportJobData(j)
	}
	return result, nil
}

// CleanupExpiredJobs implements service.ImportJobQueue
func (a *ImportQueueAdapter) CleanupExpiredJobs(ctx context.Context) (int, error) {
	return a.queue.CleanupExpiredJobs(ctx)
}

// JobStatusMapper maps between jobs.JobStatus and v1.JobStatus
type JobStatusMapper struct{}

// ToProto converts jobs.JobStatus to protobuf JobStatus
func (JobStatusMapper) ToProto(status JobStatus) v1.JobStatus {
	switch status {
	case JobStatusQueued:
		return v1.JobStatus_JOB_STATUS_QUEUED
	case JobStatusProcessing:
		return v1.JobStatus_JOB_STATUS_PROCESSING
	case JobStatusCompleted:
		return v1.JobStatus_JOB_STATUS_COMPLETED
	case JobStatusFailed:
		return v1.JobStatus_JOB_STATUS_FAILED
	case JobStatusCancelled:
		return v1.JobStatus_JOB_STATUS_CANCELLED
	default:
		return v1.JobStatus_JOB_STATUS_UNSPECIFIED
	}
}

// FromProto converts protobuf JobStatus to jobs.JobStatus
func (JobStatusMapper) FromProto(status v1.JobStatus) JobStatus {
	switch status {
	case v1.JobStatus_JOB_STATUS_QUEUED:
		return JobStatusQueued
	case v1.JobStatus_JOB_STATUS_PROCESSING:
		return JobStatusProcessing
	case v1.JobStatus_JOB_STATUS_COMPLETED:
		return JobStatusCompleted
	case v1.JobStatus_JOB_STATUS_FAILED:
		return JobStatusFailed
	case v1.JobStatus_JOB_STATUS_CANCELLED:
		return JobStatusCancelled
	default:
		return JobStatus("")
	}
}

// JobToProto converts ImportJob to protobuf ImportJobStatus
func JobToProto(job *ImportJob) *v1.ImportJobStatus {
	mapper := JobStatusMapper{}
	pbJob := &v1.ImportJobStatus{
		JobId:          job.JobID,
		UserId:         job.UserID,
		FileId:         job.FileID,
		WalletId:       job.WalletID,
		Status:         mapper.ToProto(job.Status),
		Progress:       job.Progress,
		ProcessedCount: job.ProcessedCount,
		TotalCount:     job.TotalCount,
		Result:         job.Result,
		Error:          job.Error,
		CreatedAt:      job.CreatedAt.Unix(),
		ExpiresAt:      job.ExpiresAt.Unix(),
	}

	if job.StartedAt != nil {
		pbJob.StartedAt = job.StartedAt.Unix()
	}

	if job.CompletedAt != nil {
		pbJob.CompletedAt = job.CompletedAt.Unix()
	}

	return pbJob
}
