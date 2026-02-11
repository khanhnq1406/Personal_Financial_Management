package jobs

import (
	"context"
	"fmt"
	"time"

	"github.com/go-redis/redis/v8"
)

const (
	// Redis keys
	queueKey         = "import_queue"           // List for job queue
	jobKeyPrefix     = "import_job:"            // Hash for job data
	userJobsPrefix   = "user_jobs:"             // Set for user's job IDs
	processingKey    = "import_processing"      // Set for jobs being processed

	// Timeouts
	dequeueTimeout   = 5 * time.Second          // Blocking pop timeout
	jobTTL           = 24 * time.Hour           // Job data expiration
	processingTTL    = 10 * time.Minute         // Processing lock expiration
)

// RedisImportQueue implements ImportJobQueue using Redis
type RedisImportQueue struct {
	client *redis.Client
}

// NewRedisImportQueue creates a new Redis-based import queue
func NewRedisImportQueue(client *redis.Client) *RedisImportQueue {
	return &RedisImportQueue{
		client: client,
	}
}

// jobKey returns the Redis key for a job
func jobKey(jobID string) string {
	return fmt.Sprintf("%s%s", jobKeyPrefix, jobID)
}

// userJobsKey returns the Redis key for a user's jobs
func userJobsKey(userID int32) string {
	return fmt.Sprintf("%s%d", userJobsPrefix, userID)
}

// Enqueue adds a job to the queue
func (q *RedisImportQueue) Enqueue(ctx context.Context, job *ImportJob) error {
	// Serialize job to JSON
	jobJSON, err := job.ToJSON()
	if err != nil {
		return fmt.Errorf("failed to serialize job: %w", err)
	}

	// Use Redis transaction to ensure atomicity
	pipe := q.client.TxPipeline()

	// 1. Store job data
	pipe.Set(ctx, jobKey(job.JobID), jobJSON, jobTTL)

	// 2. Add job ID to user's job set
	pipe.SAdd(ctx, userJobsKey(job.UserID), job.JobID)
	pipe.Expire(ctx, userJobsKey(job.UserID), jobTTL)

	// 3. Push job ID to queue
	pipe.RPush(ctx, queueKey, job.JobID)

	// Execute transaction
	if _, err := pipe.Exec(ctx); err != nil {
		return fmt.Errorf("failed to enqueue job: %w", err)
	}

	return nil
}

// Dequeue retrieves the next job from the queue
func (q *RedisImportQueue) Dequeue(ctx context.Context) (*ImportJob, error) {
	// Use BLPOP for blocking dequeue with timeout
	result, err := q.client.BLPop(ctx, dequeueTimeout, queueKey).Result()
	if err != nil {
		if err == redis.Nil {
			// No jobs available (timeout)
			return nil, nil
		}
		return nil, fmt.Errorf("failed to dequeue job: %w", err)
	}

	// result[0] is the key name, result[1] is the job ID
	jobID := result[1]

	// Get job data
	job, err := q.GetJob(ctx, jobID)
	if err != nil {
		return nil, err
	}

	if job == nil {
		// Job was deleted before we could retrieve it
		return nil, nil
	}

	// Add job to processing set (for recovery/monitoring)
	q.client.SAdd(ctx, processingKey, jobID)
	q.client.Expire(ctx, processingKey, processingTTL)

	return job, nil
}

// GetJob retrieves a specific job by ID
func (q *RedisImportQueue) GetJob(ctx context.Context, jobID string) (*ImportJob, error) {
	jobJSON, err := q.client.Get(ctx, jobKey(jobID)).Result()
	if err != nil {
		if err == redis.Nil {
			return nil, nil // Job not found
		}
		return nil, fmt.Errorf("failed to get job: %w", err)
	}

	var job ImportJob
	if err := job.FromJSON(jobJSON); err != nil {
		return nil, err
	}

	return &job, nil
}

// UpdateJob updates a job's state
func (q *RedisImportQueue) UpdateJob(ctx context.Context, job *ImportJob) error {
	// Serialize job to JSON
	jobJSON, err := job.ToJSON()
	if err != nil {
		return fmt.Errorf("failed to serialize job: %w", err)
	}

	// Update job data
	if err := q.client.Set(ctx, jobKey(job.JobID), jobJSON, jobTTL).Err(); err != nil {
		return fmt.Errorf("failed to update job: %w", err)
	}

	// If job is finished, remove from processing set
	if job.IsFinished() {
		q.client.SRem(ctx, processingKey, job.JobID)
	}

	return nil
}

// CancelJob cancels a job
func (q *RedisImportQueue) CancelJob(ctx context.Context, jobID string) error {
	// Get current job
	job, err := q.GetJob(ctx, jobID)
	if err != nil {
		return err
	}

	if job == nil {
		return fmt.Errorf("job not found")
	}

	// Check if job can be cancelled
	if !job.IsCancellable() {
		return fmt.Errorf("job cannot be cancelled (status: %s)", job.Status)
	}

	// Mark as cancelled
	job.MarkCancelled()

	// Update job
	return q.UpdateJob(ctx, job)
}

// DeleteJob removes a job from the queue
func (q *RedisImportQueue) DeleteJob(ctx context.Context, jobID string) error {
	// Get job to find user ID
	job, err := q.GetJob(ctx, jobID)
	if err != nil {
		return err
	}

	if job == nil {
		return nil // Already deleted
	}

	// Use transaction to remove all job data
	pipe := q.client.TxPipeline()

	// 1. Delete job data
	pipe.Del(ctx, jobKey(jobID))

	// 2. Remove from user's job set
	pipe.SRem(ctx, userJobsKey(job.UserID), jobID)

	// 3. Remove from processing set (if present)
	pipe.SRem(ctx, processingKey, jobID)

	// 4. Remove from queue (if still queued)
	pipe.LRem(ctx, queueKey, 0, jobID)

	// Execute transaction
	if _, err := pipe.Exec(ctx); err != nil {
		return fmt.Errorf("failed to delete job: %w", err)
	}

	return nil
}

// GetUserJobs retrieves all jobs for a user
func (q *RedisImportQueue) GetUserJobs(ctx context.Context, userID int32) ([]*ImportJob, error) {
	// Get all job IDs for user
	jobIDs, err := q.client.SMembers(ctx, userJobsKey(userID)).Result()
	if err != nil {
		if err == redis.Nil {
			return []*ImportJob{}, nil
		}
		return nil, fmt.Errorf("failed to get user jobs: %w", err)
	}

	// Fetch all jobs
	jobs := make([]*ImportJob, 0, len(jobIDs))
	for _, jobID := range jobIDs {
		job, err := q.GetJob(ctx, jobID)
		if err != nil {
			// Log error but continue with other jobs
			continue
		}
		if job != nil {
			jobs = append(jobs, job)
		}
	}

	return jobs, nil
}

// CleanupExpiredJobs removes expired jobs
func (q *RedisImportQueue) CleanupExpiredJobs(ctx context.Context) (int, error) {
	// Scan for all job keys
	var cursor uint64
	var count int

	for {
		keys, newCursor, err := q.client.Scan(ctx, cursor, jobKeyPrefix+"*", 100).Result()
		if err != nil {
			return count, fmt.Errorf("failed to scan jobs: %w", err)
		}

		// Check each job
		for _, key := range keys {
			jobJSON, err := q.client.Get(ctx, key).Result()
			if err != nil {
				if err == redis.Nil {
					continue // Already deleted
				}
				continue // Skip on error
			}

			var job ImportJob
			if err := job.FromJSON(jobJSON); err != nil {
				continue // Skip invalid jobs
			}

			// Delete expired jobs
			if time.Now().After(job.ExpiresAt) {
				if err := q.DeleteJob(ctx, job.JobID); err == nil {
					count++
				}
			}
		}

		cursor = newCursor
		if cursor == 0 {
			break
		}
	}

	return count, nil
}

// GetQueueLength returns the number of jobs in the queue
func (q *RedisImportQueue) GetQueueLength(ctx context.Context) (int64, error) {
	return q.client.LLen(ctx, queueKey).Result()
}

// GetProcessingCount returns the number of jobs currently being processed
func (q *RedisImportQueue) GetProcessingCount(ctx context.Context) (int64, error) {
	return q.client.SCard(ctx, processingKey).Result()
}
