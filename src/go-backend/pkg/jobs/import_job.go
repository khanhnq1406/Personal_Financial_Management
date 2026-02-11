package jobs

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	v1 "wealthjourney/protobuf/v1"
)

// JobStatus represents the current state of a job
type JobStatus string

const (
	JobStatusQueued     JobStatus = "queued"
	JobStatusProcessing JobStatus = "processing"
	JobStatusCompleted  JobStatus = "completed"
	JobStatusFailed     JobStatus = "failed"
	JobStatusCancelled  JobStatus = "cancelled"
)

// ImportJob represents a background import job
type ImportJob struct {
	JobID      string                      `json:"jobId"`
	UserID     int32                       `json:"userId"`
	FileID     string                      `json:"fileId"`
	WalletID   int32                       `json:"walletId"`
	Request    *v1.ExecuteImportRequest    `json:"request"`
	Status     JobStatus                   `json:"status"`
	Progress   int32                       `json:"progress"` // 0-100
	ProcessedCount int32                   `json:"processedCount"`
	TotalCount int32                       `json:"totalCount"`
	Result     *v1.ExecuteImportResponse   `json:"result,omitempty"`
	Error      string                      `json:"error,omitempty"`
	CreatedAt  time.Time                   `json:"createdAt"`
	StartedAt  *time.Time                  `json:"startedAt,omitempty"`
	CompletedAt *time.Time                 `json:"completedAt,omitempty"`
	ExpiresAt  time.Time                   `json:"expiresAt"`
}

// NewImportJob creates a new import job
func NewImportJob(userID int32, fileID string, walletID int32, req *v1.ExecuteImportRequest) *ImportJob {
	now := time.Now()
	jobID := uuid.New().String()

	return &ImportJob{
		JobID:      jobID,
		UserID:     userID,
		FileID:     fileID,
		WalletID:   walletID,
		Request:    req,
		Status:     JobStatusQueued,
		Progress:   0,
		ProcessedCount: 0,
		TotalCount: int32(len(req.Transactions)),
		CreatedAt:  now,
		ExpiresAt:  now.Add(24 * time.Hour), // Jobs expire after 24 hours
	}
}

// ToJSON converts ImportJob to JSON string
func (j *ImportJob) ToJSON() (string, error) {
	data, err := json.Marshal(j)
	if err != nil {
		return "", fmt.Errorf("failed to marshal job: %w", err)
	}
	return string(data), nil
}

// FromJSON parses JSON string into ImportJob
func (j *ImportJob) FromJSON(jsonStr string) error {
	if err := json.Unmarshal([]byte(jsonStr), j); err != nil {
		return fmt.Errorf("failed to unmarshal job: %w", err)
	}
	return nil
}

// UpdateProgress updates the job progress
func (j *ImportJob) UpdateProgress(processed, total int32) {
	j.ProcessedCount = processed
	j.TotalCount = total
	if total > 0 {
		j.Progress = (processed * 100) / total
	}
}

// MarkStarted marks the job as started
func (j *ImportJob) MarkStarted() {
	now := time.Now()
	j.StartedAt = &now
	j.Status = JobStatusProcessing
}

// MarkCompleted marks the job as completed with result
func (j *ImportJob) MarkCompleted(result *v1.ExecuteImportResponse) {
	now := time.Now()
	j.CompletedAt = &now
	j.Status = JobStatusCompleted
	j.Progress = 100
	j.Result = result
}

// MarkFailed marks the job as failed with error
func (j *ImportJob) MarkFailed(err error) {
	now := time.Now()
	j.CompletedAt = &now
	j.Status = JobStatusFailed
	j.Error = err.Error()
}

// MarkCancelled marks the job as cancelled
func (j *ImportJob) MarkCancelled() {
	now := time.Now()
	j.CompletedAt = &now
	j.Status = JobStatusCancelled
}

// IsFinished returns true if the job is in a terminal state
func (j *ImportJob) IsFinished() bool {
	return j.Status == JobStatusCompleted ||
		j.Status == JobStatusFailed ||
		j.Status == JobStatusCancelled
}

// IsCancellable returns true if the job can be cancelled
func (j *ImportJob) IsCancellable() bool {
	return j.Status == JobStatusQueued || j.Status == JobStatusProcessing
}

// ImportJobQueue defines the interface for job queue operations
type ImportJobQueue interface {
	// Enqueue adds a job to the queue
	Enqueue(ctx context.Context, job *ImportJob) error

	// Dequeue retrieves the next job from the queue
	Dequeue(ctx context.Context) (*ImportJob, error)

	// GetJob retrieves a specific job by ID
	GetJob(ctx context.Context, jobID string) (*ImportJob, error)

	// UpdateJob updates a job's state
	UpdateJob(ctx context.Context, job *ImportJob) error

	// CancelJob cancels a job
	CancelJob(ctx context.Context, jobID string) error

	// DeleteJob removes a job from the queue
	DeleteJob(ctx context.Context, jobID string) error

	// GetUserJobs retrieves all jobs for a user
	GetUserJobs(ctx context.Context, userID int32) ([]*ImportJob, error)

	// CleanupExpiredJobs removes expired jobs
	CleanupExpiredJobs(ctx context.Context) (int, error)
}
