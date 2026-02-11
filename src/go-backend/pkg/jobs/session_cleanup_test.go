package jobs_test

import (
	"testing"
	"wealthjourney/pkg/jobs"

	"github.com/stretchr/testify/assert"
)

func TestSessionCleanupJob_ShouldCleanExpiredSessions(t *testing.T) {
	// This is a placeholder test
	job := jobs.NewSessionCleanupJob(nil, nil)
	assert.NotNil(t, job)
}
