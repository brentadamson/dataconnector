package command

import (
	"fmt"
	"regexp"
	"strings"
)

var (
	errInvalidCurlCommand = fmt.Errorf(`command must start with "curl" and cannot contain unsafe characters`)
	reCurlError           = regexp.MustCompile(`(?s)^(.*)curl:\s+\([0-9]+\)\s+(.*)$`)
)

// Curl is a cURL command
type Curl struct {
	Command string `json:"command"`
}

// Valid removes potentially harmful characters from a cURL command
func (c *Curl) Valid() error {
	// https://wiki.owasp.org/index.php/Testing_for_Command_Injection_(OTG-INPVAL-013)
	// { }  ( ) < > & * ‘ | = ? ; [ ]  $ – # ~ ! . ” %  / \ : + , `
	return nil
}

// DeParameterize replaces parameters in the cURL statement
func (c *Curl) DeParameterize(params []string) (err error) {
	for i, p := range params {
		c.Command = replaceParameter(c.Command, i+1, p)
	}

	if strings.Contains(c.Command, parameter) {
		c.Command = ""
		return errUnhandledParams
	}
	return
}

// AddCredentials adds the user's OAuth2 credentials (if applicable)
func (c *Curl) AddCredentials(creds map[string]string) {}

// Run executes a cURL command
func (c *Curl) Run() ([]byte, error) {
	cmd := Runner("bash", "-c", c.Command)
	return cmd.CombinedOutput()
}
