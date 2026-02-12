package jobs

import (
	"context"
	"fmt"
	"log"
	"time"

	"wealthjourney/domain/service"
	"wealthjourney/pkg/logger"
	v1 "wealthjourney/protobuf/v1"
)

// ImportWorker processes import jobs from the queue
type ImportWorker struct {
	queue         ImportJobQueue
	importService service.ImportService
	workerID      string
	stopCh        chan struct{}
	doneCh        chan struct{}
}

// NewImportWorker creates a new import worker
func NewImportWorker(queue ImportJobQueue, importService service.ImportService, workerID string) *ImportWorker {
	return &ImportWorker{
		queue:         queue,
		importService: importService,
		workerID:      workerID,
		stopCh:        make(chan struct{}),
		doneCh:        make(chan struct{}),
	}
}

// Start starts the worker
func (w *ImportWorker) Start(ctx context.Context) {
	log.Printf("[Worker %s] Starting import worker", w.workerID)

	go func() {
		defer close(w.doneCh)

		for {
			select {
			case <-w.stopCh:
				log.Printf("[Worker %s] Stopping import worker", w.workerID)
				return
			case <-ctx.Done():
				log.Printf("[Worker %s] Context cancelled, stopping worker", w.workerID)
				return
			default:
				// Process next job
				if err := w.processNextJob(ctx); err != nil {
					log.Printf("[Worker %s] Error processing job: %v", w.workerID, err)
					// Wait a bit before retrying to avoid tight loop on persistent errors
					time.Sleep(5 * time.Second)
				}
			}
		}
	}()
}

// Stop stops the worker
func (w *ImportWorker) Stop() {
	close(w.stopCh)
	<-w.doneCh
}

// processNextJob dequeues and processes the next job
func (w *ImportWorker) processNextJob(ctx context.Context) error {
	// Dequeue next job
	job, err := w.queue.Dequeue(ctx)
	if err != nil {
		return fmt.Errorf("failed to dequeue job: %w", err)
	}

	// No job available (timeout)
	if job == nil {
		return nil
	}

	log.Printf("[Worker %s] Processing job %s (user: %d, transactions: %d)",
		w.workerID, job.JobID, job.UserID, job.TotalCount)

	// Mark job as started
	job.MarkStarted()
	if err := w.queue.UpdateJob(ctx, job); err != nil {
		log.Printf("[Worker %s] Failed to mark job as started: %v", w.workerID, err)
	}

	// Process the import with extended timeout
	processCtx, cancel := context.WithTimeout(ctx, 5*time.Minute)
	defer cancel()

	// Execute import with progress updates
	result, processErr := w.executeImportWithProgress(processCtx, job)

	// Update job based on result
	if processErr != nil {
		log.Printf("[Worker %s] Job %s failed: %v", w.workerID, job.JobID, processErr)
		job.MarkFailed(processErr)

		// Log error for monitoring
		logger.LogImportError(ctx, job.UserID, "worker:execute_import", processErr, map[string]interface{}{
			"job_id":     job.JobID,
			"worker_id":  w.workerID,
			"wallet_id":  job.WalletID,
			"file_id":    job.FileID,
		})
	} else {
		log.Printf("[Worker %s] Job %s completed successfully (imported: %d, skipped: %d)",
			w.workerID, job.JobID, result.Summary.TotalImported, result.Summary.TotalSkipped)
		job.MarkCompleted(result)

		// Log success for monitoring
		logger.LogImportSuccess(ctx, job.UserID, "worker:execute_import", map[string]interface{}{
			"job_id":           job.JobID,
			"worker_id":        w.workerID,
			"imported_count":   result.Summary.TotalImported,
			"duplicates_merged": result.Summary.DuplicatesMerged,
		})
	}

	// Save final job state
	if err := w.queue.UpdateJob(ctx, job); err != nil {
		log.Printf("[Worker %s] Failed to update job state: %v", w.workerID, err)
		return fmt.Errorf("failed to update job: %w", err)
	}

	return nil
}

// executeImportWithProgress executes the import and updates progress
func (w *ImportWorker) executeImportWithProgress(ctx context.Context, job *ImportJob) (*v1.ExecuteImportResponse, error) {
	// For now, we execute the full import at once
	// In the future, we could batch transactions and update progress incrementally
	result, err := w.importService.ExecuteImport(ctx, job.UserID, job.Request)
	if err != nil {
		return nil, err
	}

	// Update progress to 100%
	job.UpdateProgress(job.TotalCount, job.TotalCount)
	if updateErr := w.queue.UpdateJob(ctx, job); updateErr != nil {
		log.Printf("[Worker %s] Failed to update progress: %v", w.workerID, updateErr)
	}

	return result, nil
}

// WorkerPool manages multiple workers
type WorkerPool struct {
	workers []*ImportWorker
	ctx     context.Context
	cancel  context.CancelFunc
}

// NewWorkerPool creates a new worker pool
func NewWorkerPool(numWorkers int, queue ImportJobQueue, importService service.ImportService) *WorkerPool {
	ctx, cancel := context.WithCancel(context.Background())

	workers := make([]*ImportWorker, numWorkers)
	for i := 0; i < numWorkers; i++ {
		workerID := fmt.Sprintf("worker-%d", i+1)
		workers[i] = NewImportWorker(queue, importService, workerID)
	}

	return &WorkerPool{
		workers: workers,
		ctx:     ctx,
		cancel:  cancel,
	}
}

// Start starts all workers
func (p *WorkerPool) Start() {
	log.Printf("Starting worker pool with %d workers", len(p.workers))
	for _, worker := range p.workers {
		worker.Start(p.ctx)
	}
}

// Stop stops all workers
func (p *WorkerPool) Stop() {
	log.Println("Stopping worker pool")
	p.cancel()
	for _, worker := range p.workers {
		worker.Stop()
	}
}
