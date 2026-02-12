package parser

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"time"
)

// DateParser handles date parsing with multiple format support
type DateParser struct {
	preferredFormat string // DD/MM/YYYY or MM/DD/YYYY for ambiguity resolution
	timezone        *time.Location
}

// NewDateParser creates a new date parser with the preferred format
func NewDateParser(preferredFormat string) *DateParser {
	// Load Asia/Ho_Chi_Minh timezone
	tz, err := time.LoadLocation("Asia/Ho_Chi_Minh")
	if err != nil {
		// Fallback to UTC if timezone not available
		tz = time.UTC
	}

	return &DateParser{
		preferredFormat: preferredFormat,
		timezone:        tz,
	}
}

// Parse attempts to parse a date string using multiple strategies
func (p *DateParser) Parse(dateStr string) (time.Time, error) {
	dateStr = strings.TrimSpace(dateStr)
	if dateStr == "" {
		return time.Time{}, fmt.Errorf("empty date string")
	}

	// Strategy 1: Try preferred format first (if specified)
	if p.preferredFormat != "" {
		goFormat := p.convertToGoFormat(p.preferredFormat)
		if date, err := time.ParseInLocation(goFormat, dateStr, p.timezone); err == nil {
			if err := p.validateDate(date); err == nil {
				return date, nil
			}
		}
	}

	// Strategy 2: Try all standard formats
	date, err := p.tryStandardFormats(dateStr)
	if err == nil {
		if err := p.validateDate(date); err == nil {
			return date, nil
		}
	}

	// Strategy 3: Try regex extraction as fallback
	date, err = p.tryRegexExtraction(dateStr)
	if err == nil {
		if err := p.validateDate(date); err == nil {
			return date, nil
		}
	}

	// Strategy 4: Try Unix timestamp
	date, err = p.tryUnixTimestamp(dateStr)
	if err == nil {
		if err := p.validateDate(date); err == nil {
			return date, nil
		}
	}

	return time.Time{}, fmt.Errorf("unable to parse date: %s", dateStr)
}

// tryStandardFormats tries all standard date formats
func (p *DateParser) tryStandardFormats(dateStr string) (time.Time, error) {
	// Normalize Vietnamese month names first
	dateStr = p.normalizeVietnameseMonth(dateStr)

	// List of Go time formats to try
	formats := []string{
		"02/01/2006",        // DD/MM/YYYY
		"01/02/2006",        // MM/DD/YYYY
		"2006-01-02",        // YYYY-MM-DD (ISO 8601)
		"02-01-2006",        // DD-MM-YYYY
		"02 Jan 2006",       // DD MMM YYYY
		"02 January 2006",   // DD Month YYYY
		"02/01/06",          // DD/MM/YY
		"01/02/06",          // MM/DD/YY
		"2006/01/02",        // YYYY/MM/DD
		"02-Jan-2006",       // DD-MMM-YYYY
		"2 Jan 2006",        // D MMM YYYY (no leading zero)
		"2 January 2006",    // D Month YYYY
		"2006-01-02 15:04:05", // YYYY-MM-DD HH:MM:SS
		"02/01/2006 15:04:05", // DD/MM/YYYY HH:MM:SS
		"01/02/2006 15:04:05", // MM/DD/YYYY HH:MM:SS
	}

	// If we have a preferred format, try to resolve DD/MM vs MM/DD ambiguity
	if p.preferredFormat != "" {
		formats = p.reorderFormatsByPreference(formats)
	}

	for _, format := range formats {
		if date, err := time.ParseInLocation(format, dateStr, p.timezone); err == nil {
			return date, nil
		}
	}

	return time.Time{}, fmt.Errorf("no standard format matched")
}

// reorderFormatsByPreference moves preferred format patterns to the front
func (p *DateParser) reorderFormatsByPreference(formats []string) []string {
	if p.preferredFormat == "" {
		return formats
	}

	var reordered []string
	var others []string

	// Determine which format patterns match the preference
	prefersDDMM := strings.Contains(strings.ToUpper(p.preferredFormat), "DD/MM")

	for _, format := range formats {
		// Check if this format is DD/MM or MM/DD
		isDDMM := format == "02/01/2006" || format == "02-01-2006" || format == "02/01/06"
		isMMDD := format == "01/02/2006" || format == "01-02-2006" || format == "01/02/06"

		if (prefersDDMM && isDDMM) || (!prefersDDMM && isMMDD) {
			reordered = append(reordered, format)
		} else {
			others = append(others, format)
		}
	}

	return append(reordered, others...)
}

// tryRegexExtraction uses regex to extract date components
func (p *DateParser) tryRegexExtraction(dateStr string) (time.Time, error) {
	// Normalize Vietnamese month names
	dateStr = p.normalizeVietnameseMonth(dateStr)

	// Pattern: DD/MM/YYYY or MM/DD/YYYY with various separators
	patterns := []struct {
		regex      *regexp.Regexp
		isDDMMYYYY bool
	}{
		{regexp.MustCompile(`(\d{1,2})[/\-\.](\d{1,2})[/\-\.](\d{4})`), true}, // DD/MM/YYYY or MM/DD/YYYY
		{regexp.MustCompile(`(\d{4})[/\-\.](\d{1,2})[/\-\.](\d{1,2})`), false}, // YYYY-MM-DD
		{regexp.MustCompile(`(\d{1,2})[/\-\.](\d{1,2})[/\-\.](\d{2})`), true},  // DD/MM/YY
	}

	for _, pattern := range patterns {
		matches := pattern.regex.FindStringSubmatch(dateStr)
		if len(matches) == 4 {
			var year, month, day int
			var err error

			if pattern.isDDMMYYYY {
				// Resolve DD/MM vs MM/DD ambiguity
				prefersDDMM := !strings.Contains(strings.ToUpper(p.preferredFormat), "MM/DD")

				num1, _ := strconv.Atoi(matches[1])
				num2, _ := strconv.Atoi(matches[2])
				num3, _ := strconv.Atoi(matches[3])

				// If year is 2-digit, convert to 4-digit
				if num3 < 100 {
					if num3 >= 0 && num3 <= 50 {
						num3 += 2000
					} else {
						num3 += 1900
					}
				}
				year = num3

				// Determine day and month based on preference
				if prefersDDMM {
					day = num1
					month = num2
				} else {
					month = num1
					day = num2
				}

				// If the interpretation is invalid, try the other way
				if month > 12 || day > 31 || month < 1 || day < 1 {
					if prefersDDMM {
						month = num1
						day = num2
					} else {
						day = num1
						month = num2
					}
				}
			} else {
				// YYYY-MM-DD format
				year, err = strconv.Atoi(matches[1])
				if err != nil {
					continue
				}
				month, err = strconv.Atoi(matches[2])
				if err != nil {
					continue
				}
				day, err = strconv.Atoi(matches[3])
				if err != nil {
					continue
				}
			}

			// Validate ranges
			if month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2100 {
				continue
			}

			date := time.Date(year, time.Month(month), day, 0, 0, 0, 0, p.timezone)
			return date, nil
		}
	}

	return time.Time{}, fmt.Errorf("regex extraction failed")
}

// tryUnixTimestamp tries to parse as Unix timestamp (seconds or milliseconds)
func (p *DateParser) tryUnixTimestamp(dateStr string) (time.Time, error) {
	// Remove any non-digit characters
	cleaned := regexp.MustCompile(`[^\d]`).ReplaceAllString(dateStr, "")

	timestamp, err := strconv.ParseInt(cleaned, 10, 64)
	if err != nil {
		return time.Time{}, err
	}

	// If timestamp is in milliseconds (13 digits), convert to seconds
	if timestamp > 10000000000 {
		timestamp = timestamp / 1000
	}

	date := time.Unix(timestamp, 0).In(p.timezone)
	return date, nil
}

// normalizeVietnameseMonth converts Vietnamese month names to English
func (p *DateParser) normalizeVietnameseMonth(dateStr string) string {
	// Vietnamese month patterns - order matters (replace longer patterns first)
	replacements := []struct {
		vn string
		en string
	}{
		{"Tháng 10", "Oct"},
		{"Tháng 11", "Nov"},
		{"Tháng 12", "Dec"},
		{"tháng 10", "Oct"},
		{"tháng 11", "Nov"},
		{"tháng 12", "Dec"},
		{"Tháng 1", "Jan"},
		{"Tháng 2", "Feb"},
		{"Tháng 3", "Mar"},
		{"Tháng 4", "Apr"},
		{"Tháng 5", "May"},
		{"Tháng 6", "Jun"},
		{"Tháng 7", "Jul"},
		{"Tháng 8", "Aug"},
		{"Tháng 9", "Sep"},
		{"tháng 1", "Jan"},
		{"tháng 2", "Feb"},
		{"tháng 3", "Mar"},
		{"tháng 4", "Apr"},
		{"tháng 5", "May"},
		{"tháng 6", "Jun"},
		{"tháng 7", "Jul"},
		{"tháng 8", "Aug"},
		{"tháng 9", "Sep"},
	}

	for _, r := range replacements {
		dateStr = strings.ReplaceAll(dateStr, r.vn, r.en)
	}

	return dateStr
}

// validateDate ensures date is reasonable (not future, not too old)
func (p *DateParser) validateDate(date time.Time) error {
	now := time.Now().In(p.timezone)

	// Date cannot be in the future (allow 1 day grace period for timezone differences)
	if date.After(now.AddDate(0, 0, 1)) {
		return fmt.Errorf("date is in the future: %s", date.Format("2006-01-02"))
	}

	// Date cannot be more than 50 years old (to allow old transactions)
	fiftyYearsAgo := now.AddDate(-50, 0, 0)
	if date.Before(fiftyYearsAgo) {
		return fmt.Errorf("date is more than 50 years old: %s", date.Format("2006-01-02"))
	}

	return nil
}

// convertToGoFormat converts common date format strings to Go time format
func (p *DateParser) convertToGoFormat(format string) string {
	// Convert common format strings to Go time format
	format = strings.ReplaceAll(format, "YYYY", "2006")
	format = strings.ReplaceAll(format, "YY", "06")
	format = strings.ReplaceAll(format, "DD", "02")
	format = strings.ReplaceAll(format, "MM", "01")
	format = strings.ReplaceAll(format, "MMM", "Jan")
	return format
}
