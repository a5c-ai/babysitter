package cleanup

import (
	"fmt"
	"os"
	"path/filepath"
)

// Janitor handles the aggregation and cleanup of babysitter run directories.
type Janitor struct {
	RunsDir      string
	ProcessesDir string
}

func (j *Janitor) Cleanup() error {
	fmt.Printf("Starting babysitter cleanup in %s and %s...\n", j.RunsDir, j.ProcessesDir)
	// Logic to aggregate run metadata into docs/summaries.md and remove directories
	return nil
}

func (j *Janitor) AggregateRun(runID string) (string, error) {
	// Logic to read logs/artifacts and produce a markdown summary
	return "# Run Summary\nSuccessful completion.", nil
}
